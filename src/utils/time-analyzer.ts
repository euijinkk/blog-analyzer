import { RSSPostType } from "../blog-fetcher/type";

export interface TimeAnalysisResult {
  averageWritingTime: string; // "23:42"
  timeCategory: "아침형" | "낮형" | "저녁형" | "밤형";
  distribution: {
    morning: number; // 05:00-11:59
    afternoon: number; // 12:00-17:59
    evening: number; // 18:00-21:59
    night: number; // 22:00-04:59
  };
}

export function analyzeWritingTime(posts: RSSPostType[]): TimeAnalysisResult {
  const hours: number[] = [];
  const distribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  for (const post of posts) {
    try {
      const date = new Date(post.pubDate);
      const hour = date.getHours();
      hours.push(hour);

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

  // 평균 시간 계산 (24시간 기준)
  const avgHour =
    hours.length > 0
      ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)
      : 12; // 기본값: 낮 12시

  const avgMinute = 0; // 간단하게 정시로 처리
  const averageWritingTime = `${String(avgHour).padStart(2, "0")}:${String(
    avgMinute
  ).padStart(2, "0")}`;

  // 가장 많은 시간대 판별
  let timeCategory: "아침형" | "낮형" | "저녁형" | "밤형";
  const max = Math.max(
    distribution.morning,
    distribution.afternoon,
    distribution.evening,
    distribution.night
  );

  if (max === distribution.night) {
    timeCategory = "밤형";
  } else if (max === distribution.evening) {
    timeCategory = "저녁형";
  } else if (max === distribution.afternoon) {
    timeCategory = "낮형";
  } else {
    timeCategory = "아침형";
  }

  return {
    averageWritingTime,
    timeCategory,
    distribution,
  };
}

export function formatTimeAnalysis(result: TimeAnalysisResult): string {
  return `[분석 참고 정보]
- 평균 글쓰기 시간: ${result.averageWritingTime}
- 시간대 분포: 아침 ${result.distribution.morning}개, 낮 ${result.distribution.afternoon}개, 저녁 ${result.distribution.evening}개, 밤 ${result.distribution.night}개`;
}
