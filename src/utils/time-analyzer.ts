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

export interface ParsedTime {
  hour: number;
  minute: number;
}

const DAWN_END_HOUR = 5;
const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;
const EVENING_END_HOUR = 22;

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR;
const DEFAULT_MINUTES = 12 * MINUTES_PER_HOUR;

const TIME_SLOTS: { max: number; slot: keyof TimeDistribution }[] = [
  { max: DAWN_END_HOUR, slot: 'night' },
  { max: MORNING_END_HOUR, slot: 'morning' },
  { max: AFTERNOON_END_HOUR, slot: 'afternoon' },
  { max: EVENING_END_HOUR, slot: 'evening' },
];

export function parseTimeFromPubDate(pubDate: string): ParsedTime {
  const match = pubDate.match(/(\d{2}):(\d{2}):\d{2}/);
  if (!match) throw new Error(`Invalid pubDate format: ${pubDate}`);
  return { hour: parseInt(match[1]), minute: parseInt(match[2]) };
}

export function parsePubDates(posts: RSSPostType[]): ParsedTime[] {
  const results: ParsedTime[] = [];
  for (const post of posts) {
    try {
      results.push(parseTimeFromPubDate(post.pubDate));
    } catch {
      console.warn(`pubDate 파싱 실패: ${post.pubDate}`);
    }
  }
  return results;
}

export function classifyHourToSlot(hour: number): keyof TimeDistribution {
  return TIME_SLOTS.find((s) => hour < s.max)?.slot ?? 'night';
}

export function calculateDistribution(
  parsedTimes: ParsedTime[]
): TimeDistribution {
  const distribution: TimeDistribution = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };
  for (const { hour } of parsedTimes) {
    distribution[classifyHourToSlot(hour)]++;
  }
  return distribution;
}

function toAdjustedMinutes({ hour, minute }: ParsedTime): number {
  return hour < DAWN_END_HOUR
    ? (hour + HOURS_PER_DAY) * MINUTES_PER_HOUR + minute
    : hour * MINUTES_PER_HOUR + minute;
}

export function calculateAverageTime(parsedTimes: ParsedTime[]): string {
  if (parsedTimes.length === 0) {
    const h = Math.floor(DEFAULT_MINUTES / MINUTES_PER_HOUR);
    const m = DEFAULT_MINUTES % MINUTES_PER_HOUR;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const total = parsedTimes.reduce((sum, t) => sum + toAdjustedMinutes(t), 0);
  const avg = Math.round(total / parsedTimes.length) % MINUTES_PER_DAY;
  const avgHour = Math.floor(avg / MINUTES_PER_HOUR);
  const avgMinute = avg % MINUTES_PER_HOUR;
  return `${String(avgHour).padStart(2, '0')}:${String(avgMinute).padStart(2, '0')}`;
}

export function analyzeWritingTime(posts: RSSPostType[]): TimeAnalysisResult {
  const parsedTimes = parsePubDates(posts);
  const distribution = calculateDistribution(parsedTimes);
  const averageWritingTime = calculateAverageTime(parsedTimes);
  const timeCategory = determineTimeCategory(distribution);

  return {
    averageWritingTime,
    timeCategory,
    distribution,
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
