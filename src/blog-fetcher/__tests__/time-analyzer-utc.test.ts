process.env.TZ = 'UTC';

import { describe, expect, it } from 'vitest';
import { parseTimeFromPubDate } from '../../utils/time-analyzer';

describe('parseLocalTime (TZ=UTC)', () => {
  it('+0900 오프셋: pubDate 의 Time Zone 시간을 그대로 추출한다', () => {
    expect(parseTimeFromPubDate('Sun, 18 Jan 2026 21:49:08 +0900')).toEqual({
      hour: 21,
      minute: 49,
    });
  });
});
