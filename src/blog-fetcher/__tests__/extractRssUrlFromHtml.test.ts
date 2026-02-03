import { describe, it, expect } from "vitest";
import { parseRssUrlFromHtml } from "../extractRssUrlFromHtml";

interface TestCase {
  name: string;
  blogUrl: string;
  htmlContent: string;
  expectedRssUrl: string;
}

const testCases: TestCase[] = [
  // RSS+XML 패턴 1: rel → type → href
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
  // RSS+XML 패턴 2: type → rel → href
  {
    name: "RSS+XML type→rel→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/rss+xml" rel="alternate" href="https://example.com/rss">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss",
  },
  // RSS+XML 패턴 3: href → type
  {
    name: "RSS+XML href→type 순서의 링크를 추출할 수 있어야 함",
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
  // Atom+XML 패턴 1: rel → type → href
  {
    name: "Atom+XML rel→type→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://zzsza.github.io",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" type="application/atom+xml" title="어쩐지 오늘은 Feed" href="https://zzsza.github.io/feed.xml">
        </head>
      </html>
    `,
    expectedRssUrl: "https://zzsza.github.io/feed.xml",
  },
  // Atom+XML 패턴 2: type → rel → href
  {
    name: "Atom+XML type→rel→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/atom+xml" rel="alternate" href="https://example.com/atom.xml">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/atom.xml",
  },
  // Atom+XML 패턴 3: href → type
  {
    name: "Atom+XML href→type 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/atom.xml" type="application/atom+xml">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/atom.xml",
  },
  // JSON Feed (application/feed+json) 패턴 1: rel → type → href
  {
    name: "JSON Feed rel→type→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" type="application/feed+json" href="https://example.com/feed.json">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.json",
  },
  // JSON Feed (application/feed+json) 패턴 2: type → rel → href
  {
    name: "JSON Feed type→rel→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/feed+json" rel="alternate" href="https://example.com/feed.json">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.json",
  },
  // JSON Feed (application/feed+json) 패턴 3: href → type
  {
    name: "JSON Feed href→type 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/feed.json" type="application/feed+json">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.json",
  },
  // JSON (application/json) 패턴 1: rel → type → href
  {
    name: "JSON rel→type→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" type="application/json" href="https://example.com/feed.json">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.json",
  },
  // JSON (application/json) 패턴 2: type → rel → href
  {
    name: "JSON type→rel→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/json" rel="alternate" href="https://example.com/feed.json">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.json",
  },
  // JSON (application/json) 패턴 3: href → type
  {
    name: "JSON href→type 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/feed.json" type="application/json">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.json",
  },
  // 상대 경로 변환
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

describe("parseRssUrlFromHtml", () => {
  it.each(testCases)(
    "$name",
    ({ blogUrl, htmlContent, expectedRssUrl }) => {
      const result = parseRssUrlFromHtml(htmlContent, blogUrl);
      expect(result).toBe(expectedRssUrl);
    }
  );

  it("RSS 링크가 없으면 null을 반환해야 함", () => {
    const htmlWithoutRss = `
      <html>
        <head>
          <title>No RSS</title>
        </head>
      </html>
    `;

    const result = parseRssUrlFromHtml(htmlWithoutRss, "https://example.com");
    expect(result).toBeNull();
  });
});

