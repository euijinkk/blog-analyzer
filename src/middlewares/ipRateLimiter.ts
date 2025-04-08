import { Context, MiddlewareHandler, Next } from "hono";

type RateLimitInfo = {
  count: number;
  timestamp: number;
};

export interface Env {
  RATE_LIMITS: KVNamespace;
}

// 시간당 최대 요청 횟수
const MAX_REQUESTS_PER_HOUR = 20;
// 제한 기간 (1시간 = 3600000 밀리초)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * 클라이언트의 IP 주소를 추출합니다.
 * @param c Context 객체
 * @returns 클라이언트 IP 주소
 */
const getClientIp = (c: Context): string => {
  return (
    c.req.header("CF-Connecting-IP") ||
    c.req.header("x-forwarded-for") ||
    "unknown"
  );
};

/**
 * 주어진 IP 주소에 대한 KV 저장소 키를 생성합니다.
 * @param ip 클라이언트 IP 주소
 * @returns KV 저장소 키
 */
const getRateLimitKey = (ip: string): string => {
  return `ratelimit:${ip}`;
};

/**
 * KV 저장소에서 요청 제한 정보를 조회하고 업데이트합니다.
 * @param c Context 객체
 * @param key KV 저장소 키
 * @returns 업데이트된 요청 제한 정보
 */
const updateRateLimitInfo = async (
  c: Context<{ Bindings: Env }>,
  key: string
): Promise<RateLimitInfo> => {
  const storedData = await c.env.RATE_LIMITS.get(key);
  const now = Date.now();

  let rateLimitInfo: RateLimitInfo;

  if (storedData) {
    rateLimitInfo = JSON.parse(storedData) as RateLimitInfo;

    // 제한 기간이 지났으면 카운터 리셋
    if (now - rateLimitInfo.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitInfo = {
        count: 1,
        timestamp: now,
      };
    } else {
      // 제한 기간 내에 요청 수 증가
      rateLimitInfo.count++;
    }
  } else {
    // 새로운 IP 주소의 첫 요청
    rateLimitInfo = {
      count: 1,
      timestamp: now,
    };
  }

  // KV에 업데이트된 요청 정보 저장
  await c.env.RATE_LIMITS.put(key, JSON.stringify(rateLimitInfo));

  return rateLimitInfo;
};

/**
 * 응답 헤더에 요청 제한 정보를 추가합니다.
 * @param c Context 객체
 * @param rateLimitInfo 요청 제한 정보
 */
const setRateLimitHeaders = (
  c: Context,
  rateLimitInfo: RateLimitInfo
): void => {
  const remainingRequests = Math.max(
    0,
    MAX_REQUESTS_PER_HOUR - rateLimitInfo.count
  );
  c.header("X-RateLimit-Limit", MAX_REQUESTS_PER_HOUR.toString());
  c.header("X-RateLimit-Remaining", remainingRequests.toString());
  c.header(
    "X-RateLimit-Reset",
    (rateLimitInfo.timestamp + RATE_LIMIT_WINDOW_MS).toString()
  );
};

/**
 * 요청 제한을 초과했는지 확인합니다.
 * @param rateLimitInfo 요청 제한 정보
 * @returns 제한 초과 여부
 */
const isRateLimitExceeded = (rateLimitInfo: RateLimitInfo): boolean => {
  return rateLimitInfo.count > MAX_REQUESTS_PER_HOUR;
};

/**
 * 요청 제한 초과 응답을 생성합니다.
 * @param c Context 객체
 * @param rateLimitInfo 요청 제한 정보
 * @returns 429 Too Many Requests 응답
 */
const createRateLimitExceededResponse = (
  c: Context,
  rateLimitInfo: RateLimitInfo
): Response => {
  const resetTime = new Date(rateLimitInfo.timestamp + RATE_LIMIT_WINDOW_MS);
  return c.json(
    {
      error: "Too many requests",
      message: `Rate limit exceeded. Try again after ${resetTime.toLocaleString()}`,
      reset_at: resetTime.toISOString(),
    },
    429
  );
};

/**
 * IP 기반 요청 제한 미들웨어
 * 클라이언트 IP 주소를 기반으로 시간당 요청 수를 제한합니다.
 */
export const ipRateLimiter = (): MiddlewareHandler<{
  Bindings: Env;
}> => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      // 클라이언트 IP 주소 가져오기
      const clientIp = getClientIp(c);

      if (clientIp === "unknown") {
        return c.json({ error: "Could not determine client IP" }, 400);
      }

      // KV 저장소 키 생성
      const key = getRateLimitKey(clientIp);

      // 요청 제한 정보 조회 및 업데이트
      const rateLimitInfo = await updateRateLimitInfo(c, key);

      // 응답 헤더 설정
      setRateLimitHeaders(c, rateLimitInfo);

      // 요청 제한 초과 확인
      if (isRateLimitExceeded(rateLimitInfo)) {
        return createRateLimitExceededResponse(c, rateLimitInfo);
      }

      // 제한을 초과하지 않으면 다음 미들웨어/핸들러로 이동
      await next();
    } catch (error) {
      console.error("Rate limit error:", error);
      // 오류 발생 시 요청 처리 허용 (실패 안전)
      await next();
    }
  };
};
