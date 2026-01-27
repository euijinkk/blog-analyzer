import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractRssUrlFromHtml } from "../extractRssUrlFromHtml";
import ky from "ky";

// ky 모듈 모킹
vi.mock("ky", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("RSS URL 추출 테스트", () => {
  // 각 테스트 전에 모킹 초기화
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // HTML에서 RSS 링크 추출 테스트 - Tistory 형식
  it("티스토리 형식의 RSS 링크를 추출할 수 있어야 함", async () => {
    const blogUrl = "https://happysisyphe.tistory.com";
    const htmlContent = `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" title="행복한 시지프" href="https://happysisyphe.tistory.com/rss">
        </head>
      </html>
    `;

    // ky.get 모킹
    vi.mocked(ky.get).mockImplementation(
      () =>
      ({
        text: () => Promise.resolve(htmlContent),
      } as any)
    );

    const result = await extractRssUrlFromHtml(blogUrl);
    expect(result).toBe("https://happysisyphe.tistory.com/rss");
    expect(ky.get).toHaveBeenCalledWith(blogUrl);
  });

  // HTML에서 RSS 링크 추출 테스트 - 네이버 형식
  it("네이버 블로그 형식의 RSS 링크를 추출할 수 있어야 함", async () => {
    const blogUrl = "https://blog.naver.com/gytks4";
    const htmlContent = `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" href="https://rss.blog.naver.com/gytks4.xml" title="RSS feed for gytks4 Blog">
        </head>
      </html>
    `;

    vi.mocked(ky.get).mockImplementation(
      () =>
      ({
        text: () => Promise.resolve(htmlContent),
      } as any)
    );

    const result = await extractRssUrlFromHtml(blogUrl);
    expect(result).toBe("https://rss.blog.naver.com/gytks4.xml");
  });

  // HTML에서 RSS 링크 추출 테스트 - Brunch 형식
  it("브런치 형식의 RSS 링크를 추출할 수 있어야 함", async () => {
    const blogUrl = "https://brunch.co.kr/@writer";
    const htmlContent = `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" title="행복한 시지프 rss" href="https://brunch.co.kr/rss/@@3Vzi">
        </head>
      </html>
    `;

    vi.mocked(ky.get).mockImplementation(
      () =>
      ({
        text: () => Promise.resolve(htmlContent),
      } as any)
    );

    const result = await extractRssUrlFromHtml(blogUrl);
    expect(result).toBe("https://brunch.co.kr/rss/@@3Vzi");
  });

  // HTML에서 RSS 링크 추출 테스트 - Medium 형식
  it("미디엄 형식의 RSS 링크를 추출할 수 있어야 함", async () => {
    const blogUrl = "https://medium.com/@euijinkk97";
    const htmlContent = `
      <html>
        <head>
          <link id="feedLink" rel="alternate" type="application/rss+xml" title="RSS" href="https://medium.com/feed/@euijinkk97" data-rh="true">
        </head>
      </html>
    `;

    vi.mocked(ky.get).mockImplementation(
      () =>
      ({
        text: () => Promise.resolve(htmlContent),
      } as any)
    );

    const result = await extractRssUrlFromHtml(blogUrl);
    expect(result).toBe("https://medium.com/feed/@euijinkk97");
  });

  // 다양한 속성 순서의 RSS 링크 추출 테스트
  it("다양한 속성 순서를 가진 RSS 링크를 추출할 수 있어야 함", async () => {
    const blogUrl = "https://example.com";
    const htmlContent = `
      <html>
        <head>
          <link href="https://example.com/rss" type="application/rss+xml" rel="alternate" title="Example RSS">
        </head>
      </html>
    `;

    vi.mocked(ky.get).mockImplementation(
      () =>
      ({
        text: () => Promise.resolve(htmlContent),
      } as any)
    );

    const result = await extractRssUrlFromHtml(blogUrl);
    expect(result).toBe("https://example.com/rss");
  });

  // 상대 경로 RSS 링크 테스트
  it("상대 경로 RSS 링크를 절대 경로로 변환할 수 있어야 함", async () => {
    const blogUrl = "https://example.com/blog";
    const htmlContent = `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        </head>
      </html>
    `;

    vi.mocked(ky.get).mockImplementation(
      () =>
      ({
        text: () => Promise.resolve(htmlContent),
      } as any)
    );

    const result = await extractRssUrlFromHtml(blogUrl);
    expect(result).toBe("https://example.com/feed.xml");
  });
});
