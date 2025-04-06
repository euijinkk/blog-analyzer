import ky from "ky";

/**
 * HTML 페이지에서 RSS 피드 URL을 추출
 */
export async function extractRssUrlFromHtml(
  url: string
): Promise<string | null> {
  try {
    // 웹 페이지 가져오기
    const response = await ky.get(url).text();

    // RSS 피드 링크 패턴 찾기
    // 1. <link rel="alternate" type="application/rss+xml" href="..."> 형식
    const rssLinkMatch =
      response.match(
        /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/rss\+xml["\'][^>]*href=["\']([^"\'>]+)["\']/i
      ) ||
      response.match(
        /<link[^>]*type=["\']application\/rss\+xml["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
      ) ||
      response.match(
        /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/rss\+xml["\']/i
      );

    if (rssLinkMatch && rssLinkMatch[1]) {
      // 상대 URL을 절대 URL로 변환
      const rssUrl = new URL(rssLinkMatch[1], url).href;
      return rssUrl;
    }

    // 2. 원하는 RSS 링크를 찾지 못한 경우
    return null;
  } catch (error) {
    console.error("웹 페이지에서 RSS URL 추출 실패:", error);
    throw error;
  }
}

/**
 * 블로그 플랫폼 타입 정의
 */
type BlogPlatform = {
  name: string;
  check: (hostname: string) => boolean;
  extractUsername?: (parsedUrl: URL) => string | null;
  generateRssUrl: (parsedUrl: URL) => string | Promise<string>;
  exampleUrl: string;
};

/**
 * 티스토리 블로그 플랫폼
 */
const tistoryPlatform: BlogPlatform = {
  name: "티스토리",
  check: (hostname) => hostname.endsWith("tistory.com"),
  generateRssUrl: (parsedUrl) =>
    `${parsedUrl.protocol}//${parsedUrl.hostname}/rss`,
  exampleUrl: "example.tistory.com",
};

/**
 * 네이버 블로그 플랫폼
 */
const naverPlatform: BlogPlatform = {
  name: "네이버 블로그",
  check: (hostname) => hostname === "blog.naver.com",
  extractUsername: (parsedUrl) => {
    const match = parsedUrl.pathname.match(/^\/([^/]+)/);
    return match ? match[1] : null;
  },
  generateRssUrl: (parsedUrl) => {
    const username = naverPlatform.extractUsername?.(parsedUrl);
    if (!username) {
      throw new Error(
        `유효하지 않은 ${naverPlatform.name} URL 형식입니다. 예시: https://${naverPlatform.exampleUrl}`
      );
    }
    return `https://rss.blog.naver.com/${username}.xml`;
  },
  exampleUrl: "blog.naver.com/username",
};

/**
 * 벨로그 플랫폼
 */
const velogPlatform: BlogPlatform = {
  name: "벨로그",
  check: (hostname) => hostname === "velog.io",
  extractUsername: (parsedUrl) => {
    const match = parsedUrl.pathname.match(/^\/\@([^/]+)/);
    return match ? match[1] : null;
  },
  generateRssUrl: (parsedUrl) => {
    const username = velogPlatform.extractUsername?.(parsedUrl);
    if (!username) {
      throw new Error(
        `유효하지 않은 ${velogPlatform.name} URL 형식입니다. 예시: https://${velogPlatform.exampleUrl}`
      );
    }
    return `https://v2.velog.io/rss/${username}`;
  },
  exampleUrl: "velog.io/@username/posts",
};

/**
 * Medium 플랫폼
 */
const mediumPlatform: BlogPlatform = {
  name: "Medium",
  check: (hostname) => hostname === "medium.com",
  generateRssUrl: async (parsedUrl) => {
    // Medium은 username에 따라 RSS URL이 달라지기 때문에 HTML에서 찾는 것이 필요
    const rssUrl = await extractRssUrlFromHtml(parsedUrl.href);
    if (rssUrl) {
      return rssUrl;
    }

    // HTML에서 찾지 못했다면, 추측된 URL 사용
    // Medium 형식: https://medium.com/feed/@username
    const username = parsedUrl.pathname.match(/^\/@([^/]+)/);
    if (username && username[1]) {
      return `https://medium.com/feed/@${username[1]}`;
    }

    throw new Error(
      `유효하지 않은 ${mediumPlatform.name} URL 형식입니다. 예시: https://${mediumPlatform.exampleUrl}`
    );
  },
  exampleUrl: "medium.com/@username",
};

/**
 * Brunch 플랫폼
 */
const brunchPlatform: BlogPlatform = {
  name: "Brunch",
  check: (hostname) => hostname === "brunch.co.kr",
  generateRssUrl: async (parsedUrl) => {
    // HTML에서 RSS URL 찾기
    const rssUrl = await extractRssUrlFromHtml(parsedUrl.href);
    if (rssUrl) {
      return rssUrl;
    }

    // HTML에서 찾지 못했다면, 표준 형식 사용
    // Brunch 형식: https://brunch.co.kr/rss/@@username
    const username = parsedUrl.pathname.split("/").filter(Boolean)[0];
    if (username) {
      return `https://brunch.co.kr/rss/@${username}`;
    }

    throw new Error(
      `유효하지 않은 ${brunchPlatform.name} URL 형식입니다. 예시: https://${brunchPlatform.exampleUrl}`
    );
  },
  exampleUrl: "brunch.co.kr/@username",
};

/**
 * 기타 플랫폼을 위한 기본 플랫폼
 */
const genericPlatform: BlogPlatform = {
  name: "기타 블로그",
  check: () => true, // 항상 마지막에 처리되도록 기본값은 true
  generateRssUrl: async (parsedUrl) => {
    // HTML에서 RSS URL 찾기 시도
    const rssUrl = await extractRssUrlFromHtml(parsedUrl.href);
    if (rssUrl) {
      return rssUrl;
    }

    // RSS URL을 찾지 못했으면 오류 발생
    throw new Error(
      `${parsedUrl.hostname}에서 RSS 피드 URL을 찾을 수 없습니다.`
    );
  },
  exampleUrl: "example.com",
};

/**
 * 지원하는 모든 블로그 플랫폼
 */
const supportedPlatforms: BlogPlatform[] = [
  tistoryPlatform,
  naverPlatform,
  velogPlatform,
  mediumPlatform,
  brunchPlatform,
  // genericPlatform은 항상 마지막에 배치
];

/**
 * URL 유효성 검사 및 파싱
 */
function parseAndValidateUrl(url: string): URL {
  try {
    return new URL(url);
  } catch (error) {
    throw new Error(`유효하지 않은 URL 형식입니다: ${url}`);
  }
}

/**
 * URL이 이미 RSS URL인지 확인
 */
function isRssUrl(url: string): boolean {
  // URL에 'rss' 포함 또는 '.xml'로 끝나는지 확인
  return (
    url.toLowerCase().includes("/rss") ||
    url.toLowerCase().includes("/feed") ||
    url.toLowerCase().includes("rss.") ||
    url.toLowerCase().endsWith(".xml")
  );
}

/**
 * 지원하는 블로그 플랫폼 찾기
 */
function findSupportedPlatform(hostname: string): BlogPlatform | null {
  return (
    supportedPlatforms.find((platform) => platform.check(hostname)) || null
  );
}

export async function getRssFromUrl(url: string): Promise<string> {
  try {
    // 이미 RSS URL인 경우 그대로 반환
    if (isRssUrl(url)) {
      return url;
    }

    // 원래 URL이 HTML이면 헨더에서 추출 시도
    const rssUrl = await extractRssUrlFromHtml(url);
    if (rssUrl) {
      return rssUrl;
    }

    const parsedUrl = parseAndValidateUrl(url);
    const { hostname } = parsedUrl;

    // 지원하는 플랫폼 여부 확인
    const platform = findSupportedPlatform(hostname);
    if (!platform) {
      // 지원되는 플랫폼이 아니면 일반적인 방법으로 추출 시도
      return await genericPlatform.generateRssUrl(parsedUrl);
    }

    // 해당 플랫폼에 맞는 RSS URL 생성
    return await platform.generateRssUrl(parsedUrl);
  } catch (error) {
    // 에러 그대로 다시 던지기
    if (error instanceof Error) {
      throw new Error(`해당 블로그는 RSS 를 제대로 제공하지 않습니다.`);
    }
    throw new Error(`해당 블로그는 RSS 를 제대로 제공하지 않습니다.`);
  }
}
