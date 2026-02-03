import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractRssUrlFromHtml } from "../extractRssUrlFromHtml";
import ky from "ky";

// ky 모듈 모킹
vi.mock("ky", () => ({
  default: {
    get: vi.fn(),
  },
}));

interface TestCase {
  name: string;
  blogUrl: string;
  htmlContent: string;
  expectedRssUrl: string;
  shouldVerifyCalledWith?: boolean;
}

const testCases: TestCase[] = [
  {
    name: "티스토리 형식의 RSS 링크를 추출할 수 있어야 함",
    blogUrl: "https://happysisyphe.tistory.com",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" title="행복한 시지프" href="https://happysisyphe.tistory.com/rss">
        </head>
      </html>
    `,
    expectedRssUrl: "https://happysisyphe.tistory.com/rss",
  },
  {
    name: "네이버 블로그 형식의 RSS 링크를 추출할 수 있어야 함",
    blogUrl: "https://blog.naver.com/gytks4",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" href="https://rss.blog.naver.com/gytks4.xml" title="RSS feed for gytks4 Blog">
        </head>
      </html>
    `,
    expectedRssUrl: "https://rss.blog.naver.com/gytks4.xml",
  },
  {
    name: "브런치 형식의 RSS 링크를 추출할 수 있어야 함",
    blogUrl: "https://brunch.co.kr/@writer",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" title="행복한 시지프 rss" href="https://brunch.co.kr/rss/@@3Vzi">
        </head>
      </html>
    `,
    expectedRssUrl: "https://brunch.co.kr/rss/@@3Vzi",
  },
  {
    name: "미디엄 형식의 RSS 링크를 추출할 수 있어야 함",
    blogUrl: "https://medium.com/@euijinkk97",
    htmlContent: `
      <html>
        <head>
          <link id="feedLink" rel="alternate" type="application/rss+xml" title="RSS" href="https://medium.com/feed/@euijinkk97" data-rh="true">
        </head>
      </html>
    `,
    expectedRssUrl: "https://medium.com/feed/@euijinkk97",
  },
  {
    name: "다양한 속성 순서를 가진 RSS 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/rss" type="application/rss+xml" rel="alternate" title="Example RSS">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss",
  },
  {
    name: "상대 경로 RSS 링크를 절대 경로로 변환할 수 있어야 함",
    blogUrl: "https://example.com/blog",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.xml",
  },
];

describe("RSS URL 추출 테스트", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each(testCases)(
    "$name",
    async ({ blogUrl, htmlContent, expectedRssUrl, shouldVerifyCalledWith }) => {
      vi.mocked(ky.get).mockImplementation(
        () =>
          ({
            text: () => Promise.resolve(htmlContent),
          }) as any
      );

      const result = await extractRssUrlFromHtml(blogUrl);

      expect(result).toBe(expectedRssUrl);
    }
  );
});
