import { RSSPostType } from '../blog-fetcher/type';

export interface TimeDistribution {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export type TimeCategory = '아침형' | '낮형' | '저녁형' | '밤형';

export interface TimeAnalysisResult {
  averageWritingTime: string; // "23:42"
  timeCategory: TimeCategory;
  distribution: TimeDistribution;
}

export function analyzeWritingTime(posts: RSSPostType[]): TimeAnalysisResult {
  const { distribution, averageWritingTime } = analyzePubDate(posts);
  const timeCategory = determineTimeCategory(distribution);

  return {
    averageWritingTime,
    timeCategory,
    distribution,
  };
}

export function analyzePubDate(posts: RSSPostType[]): {
  distribution: TimeDistribution;
  averageWritingTime: string;
} {
  const totalMinutes: number[] = [];
  const distribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  for (const post of posts) {
    try {
      const date = new Date(post.pubDate);
      const hour = date.getHours();
      const minute = date.getMinutes();
      // 0~4시(새벽)는 24~28시로 치환하여 야간 연속성 유지
      const adjusted =
        hour < 5 ? (hour + 24) * 60 + minute : hour * 60 + minute;
      totalMinutes.push(adjusted);

      // 시간대별 분류
      if (hour >= 5 && hour < 12) {
        distribution.morning++;
      } else if (hour >= 12 && hour < 18) {
        distribution.afternoon++;
      } else if (hour >= 18 && hour < 22) {
        distribution.evening++;
      } else {
        distribution.night++;
      }
    } catch (error) {
      console.warn(`pubDate 파싱 실패: ${post.pubDate}`);
    }
  }

  // 평균 시간 계산 (분 단위, 자정 래핑 처리)
  const avgTotalMinutes =
    totalMinutes.length > 0
      ? Math.round(
          totalMinutes.reduce((a, b) => a + b, 0) / totalMinutes.length
        ) %
        (24 * 60)
      : 12 * 60; // 기본값: 낮 12시

  const avgHour = Math.floor(avgTotalMinutes / 60);
  const avgMinute = avgTotalMinutes % 60;
  const averageWritingTime = `${String(avgHour).padStart(2, '0')}:${String(
    avgMinute
  ).padStart(2, '0')}`;

  return {
    distribution,
    averageWritingTime,
  };
}

const CATEGORY_MAP: { key: keyof TimeDistribution; label: TimeCategory }[] = [
  { key: 'night', label: '밤형' },
  { key: 'evening', label: '저녁형' },
  { key: 'afternoon', label: '낮형' },
  { key: 'morning', label: '아침형' },
];

export function determineTimeCategory(
  distribution: TimeDistribution
): TimeCategory {
  return CATEGORY_MAP.reduce((max, curr) =>
    distribution[curr.key] > distribution[max.key] ? curr : max
  ).label;
}

export function formatTimeAnalysis(result: TimeAnalysisResult): string {
  return `[분석 참고 정보]
- 평균 글쓰기 시간: ${result.averageWritingTime}
- 시간대 분포: 아침 ${result.distribution.morning}개, 낮 ${result.distribution.afternoon}개, 저녁 ${result.distribution.evening}개, 밤 ${result.distribution.night}개`;
}
