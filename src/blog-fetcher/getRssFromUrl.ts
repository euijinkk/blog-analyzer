import { extractRssUrlFromHtml } from './extractRssUrlFromHtml';
import { isRssUrl } from './isRssUrl';

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
  name: '티스토리',
  check: (hostname) => hostname.endsWith('tistory.com'),
  generateRssUrl: (parsedUrl) =>
    `${parsedUrl.protocol}//${parsedUrl.hostname}/rss`,
  exampleUrl: 'example.tistory.com',
};

/**
 * 네이버 블로그 데스크톱 플랫폼
 */
const naverDesktopPlatform: BlogPlatform = {
  name: '네이버 블로그 (데스크톱)',
  check: (hostname) => hostname === 'blog.naver.com',
  extractUsername: (parsedUrl) => {
    const match = parsedUrl.pathname.match(/^\/([^/]+)/);
    return match ? match[1] : null;
  },
  generateRssUrl: (parsedUrl) => {
    const username = naverDesktopPlatform.extractUsername?.(parsedUrl);
    if (!username) {
      throw new Error(
        `유효하지 않은 ${naverDesktopPlatform.name} URL 형식입니다. 예시: https://${naverDesktopPlatform.exampleUrl}`
      );
    }
    return `https://rss.blog.naver.com/${username}.xml`;
  },
  exampleUrl: 'blog.naver.com/username',
};

/**
 * 네이버 블로그 모바일 플랫폼
 */
const naverMobilePlatform: BlogPlatform = {
  name: '네이버 블로그 (모바일)',
  check: (hostname) => hostname === 'm.blog.naver.com',
  extractUsername: (parsedUrl) => {
    // 1. 쿼리 파라미터에서 blogId 추출: ?blogId=gytks4
    const urlParams = new URLSearchParams(parsedUrl.search);
    const blogId = urlParams.get('blogId');
    if (blogId) {
      return blogId;
    }

    // 2. 경로에서 사용자명 추출: /gytks4
    const pathMatch = parsedUrl.pathname.match(/^\/([^/]+)$/);
    if (pathMatch && pathMatch[1] != null) {
      return pathMatch[1];
    }

    return null;
  },
  generateRssUrl: (parsedUrl) => {
    const username = naverMobilePlatform.extractUsername?.(parsedUrl);
    if (!username) {
      throw new Error(
        `유효하지 않은 ${naverMobilePlatform.name} URL 형식입니다. 예시: https://${naverMobilePlatform.exampleUrl}`
      );
    }
    return `https://rss.blog.naver.com/${username}.xml`;
  },
  exampleUrl: 'm.blog.naver.com/username',
};

/**
 * 벨로그 플랫폼
 */
const velogPlatform: BlogPlatform = {
  name: '벨로그',
  check: (hostname) => hostname === 'velog.io',
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
  exampleUrl: 'velog.io/@username/posts',
};

/**
 * Medium 플랫폼
 */
const mediumPlatform: BlogPlatform = {
  name: 'Medium',
  check: (hostname) => hostname === 'medium.com',
  generateRssUrl: async (parsedUrl) => {
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
  exampleUrl: 'medium.com/@username',
};

/**
 * Brunch 플랫폼
 */
const brunchPlatform: BlogPlatform = {
  name: 'Brunch',
  check: (hostname) => hostname === 'brunch.co.kr',
  generateRssUrl: async (parsedUrl) => {
    // HTML에서 RSS URL 찾기 시도 (예외 발생 시 무시)
    try {
      const rssUrl = await extractRssUrlFromHtml(parsedUrl.href);
      if (rssUrl) {
        return rssUrl;
      }
    } catch (error) {
      // HTML 추출 실패 시 폴백 로직으로 진행
      console.log('Brunch HTML 추출 실패, 패턴 기반 URL 생성', error);
    }

    // HTML에서 찾지 못했다면, 표준 형식 사용
    // Brunch 형식: https://brunch.co.kr/rss/@@username
    const username = parsedUrl.pathname.split('/').filter(Boolean)[0];
    if (username) {
      return `https://brunch.co.kr/rss/@${username}`;
    }

    throw new Error(
      `유효하지 않은 ${brunchPlatform.name} URL 형식입니다. 예시: https://${brunchPlatform.exampleUrl}`
    );
  },
  exampleUrl: 'brunch.co.kr/@username',
};

/**
 * 기타 플랫폼을 위한 기본 플랫폼
 */
const genericPlatform: BlogPlatform = {
  name: '기타 블로그',
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
  exampleUrl: 'example.com',
};

/**
 * 지원하는 모든 블로그 플랫폼
 */
const supportedPlatforms: BlogPlatform[] = [
  tistoryPlatform,
  naverDesktopPlatform,
  naverMobilePlatform,
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

    // 원래 URL이 HTML이면 헨더에서 추출 시도 (예외 발생 시 무시)
    try {
      const rssUrl = await extractRssUrlFromHtml(url);
      if (rssUrl) {
        return rssUrl;
      }
    } catch (error) {
      // HTML에서 추출 실패 시 플랫폼별 폴백 로직으로 진행
      console.log('HTML에서 RSS URL 추출 실패, 플랫폼별 폴백 시도', error);
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
