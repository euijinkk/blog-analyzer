import { describe, expect, it, beforeAll } from 'vitest';
import {
  analyzeWritingTime,
  determineTimeCategory,
  parsePubDates,
  parseLocalTime,
  classifyHourToSlot,
  calculateDistribution,
  calculateAverageTime,
  TimeDistribution,
} from '../../utils/time-analyzer';
import { RSS_BLOG_POSTS } from '../../../fixtures/BLOG_POSTS';
import { RSSPostType } from '../type';

describe.each(['UTC', 'Asia/Seoul', 'America/New_York'])(
  'parseLocalTime (TZ=%s)',
  (tz) => {
    beforeAll(() => {
      process.env.TZ = tz;
    });

    it('+0900 오프셋: 시간을 그대로 추출한다', () => {
      expect(parseLocalTime('Sun, 18 Jan 2026 21:49:08 +0900')).toEqual({
        hour: 21,
        minute: 49,
      });
    });

    it('+0000 오프셋: pubDate 의 Time Zone 시간을 그대로 추출한다', () => {
      expect(parseLocalTime('Wed, 7 Jan 2026 13:08:23 +0000')).toEqual({
        hour: 13,
        minute: 8,
      });
    });

    it('음수 오프셋(-0500): pubDate 의 Time Zone 시간을 그대로 추출한다', () => {
      expect(parseLocalTime('Wed, 7 Jan 2026 08:30:00 -0500')).toEqual({
        hour: 8,
        minute: 30,
      });
    });
  }
);

describe.each(['UTC', 'Asia/Seoul', 'America/New_York'])(
  'analyzeWritingTime (TZ=%s)',
  (tz) => {
    beforeAll(() => {
      process.env.TZ = tz;
    });

    it('어떤 타임존에서든 동일한 결과를 반환한다', () => {
      const result = analyzeWritingTime(RSS_BLOG_POSTS);
      expect(result).toEqual({
        averageWritingTime: '22:49',
        timeCategory: '밤형',
        distribution: { morning: 0, afternoon: 0, evening: 3, night: 7 },
      });
    });
  }
);

describe('determineTimeCategory', () => {
  it('시간 분포에 따라 시간 카테고리를 결정한다', () => {
    // Given
    const distribution: TimeDistribution = {
      morning: 0,
      afternoon: 0,
      evening: 3,
      night: 7,
    };

    // When
    const result = determineTimeCategory(distribution);

    // Then
    expect(result).toBe('밤형');
  });
});

describe('parsePubDates', () => {
  it('posts 배열에서 {hour, minute}[]를 추출한다', () => {
    // Given
    const posts: RSSPostType[] = [
      {
        title: '',
        author: '',
        description: '',
        pubDate: 'Sun, 18 Jan 2026 21:49:08 +0900',
        link: '',
      },
      {
        title: '',
        author: '',
        description: '',
        pubDate: 'Wed, 7 Jan 2026 22:08:23 +0900',
        link: '',
      },
    ];

    // When
    const result = parsePubDates(posts);

    // Then
    expect(result).toEqual([
      { hour: 21, minute: 49 },
      { hour: 22, minute: 8 },
    ]);
  });

  it('파싱 실패 시 해당 항목을 필터링한다', () => {
    // Given
    const posts = [
      {
        title: '',
        author: '',
        description: '',
        pubDate: 'invalid-date',
        link: '',
      },
      {
        title: '',
        author: '',
        description: '',
        pubDate: 'Sun, 18 Jan 2026 21:49:08 +0900',
        link: '',
      },
    ];

    // When
    const result = parsePubDates(posts);

    // Then
    expect(result).toEqual([{ hour: 21, minute: 49 }]);
  });
});

describe('classifyHourToSlot', () => {
  it.each([
    { hour: 0, expected: 'night' },
    { hour: 4, expected: 'night' },
    { hour: 5, expected: 'morning' },
    { hour: 11, expected: 'morning' },
    { hour: 12, expected: 'afternoon' },
    { hour: 17, expected: 'afternoon' },
    { hour: 18, expected: 'evening' },
    { hour: 21, expected: 'evening' },
    { hour: 22, expected: 'night' },
    { hour: 23, expected: 'night' },
  ])('hour=$hour → $expected', ({ hour, expected }) => {
    expect(classifyHourToSlot(hour)).toBe(expected);
  });
});

describe('calculateDistribution', () => {
  it('시간과 분을 받아, 각 시간대별 개수를 반환한다', () => {
    // Given
    const parsedTimes = [
      { hour: 7, minute: 0 }, // morning
      { hour: 14, minute: 30 }, // afternoon
      { hour: 19, minute: 0 }, // evening
      { hour: 23, minute: 0 }, // night
    ];

    // When
    const result = calculateDistribution(parsedTimes);

    // Then
    expect(result).toEqual({
      morning: 1,
      afternoon: 1,
      evening: 1,
      night: 1,
    });
  });

  it('빈 배열을 받으면, 모든 시간대가 0개인 객체를 반환한다', () => {
    // When
    const result = calculateDistribution([]);

    // Then
    expect(result).toEqual({
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    });
  });
});

describe('calculateAverageTime', () => {
  it('시간과 분을 받아, 평균 시간을 반환한다', () => {
    // Given
    const parsedTimes = [
      { hour: 10, minute: 0 },
      { hour: 12, minute: 0 },
    ];

    // When
    const result = calculateAverageTime(parsedTimes);

    // Then
    expect(result).toBe('11:00');
  });

  it('새벽 시간대를 넘어가는 경우, 다음 날짜의 시간으로 계산한다', () => {
    // Given
    const parsedTimes = [
      { hour: 23, minute: 0 },
      { hour: 1, minute: 0 },
    ];

    // When
    const result = calculateAverageTime(parsedTimes);

    // Then
    expect(result).toBe('00:00');
  });

  it('빈 배열을 받으면, 기본값 "12:00"을 반환한다', () => {
    // When
    const result = calculateAverageTime([]);

    // Then
    expect(result).toBe('12:00');
  });
});
