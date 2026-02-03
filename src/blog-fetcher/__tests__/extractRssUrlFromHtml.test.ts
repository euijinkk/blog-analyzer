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
  // Atom+XML 패턴 3: href → type → rel
  {
    name: "Atom+XML href→type→rel 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/atom.xml" type="application/atom+xml" rel="alternate">
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
  // JSON Feed (application/feed+json) 패턴 3: href → type → rel
  {
    name: "JSON Feed href→type→rel 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/feed.json" type="application/feed+json" rel="alternate">
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
  // JSON (application/json) 패턴 3: href → type → rel
  {
    name: "JSON href→type→rel 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/feed.json" type="application/json" rel="alternate">
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
  // 누락된 속성 순서: rel → href → type
  {
    name: "RSS+XML rel→href→type 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" href="https://example.com/rss.xml" type="application/rss+xml">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss.xml",
  },
  // 누락된 속성 순서: type → href → rel
  {
    name: "RSS+XML type→href→rel 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/rss+xml" href="https://example.com/rss.xml" rel="alternate">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss.xml",
  },
  // 누락된 속성 순서: href → rel → type
  {
    name: "RSS+XML href→rel→type 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/rss.xml" rel="alternate" type="application/rss+xml">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss.xml",
  },
  // Atom+XML 누락된 순서
  {
    name: "Atom+XML type→href→rel 순서의 링크를 추출할 수 있어야 함 (2)",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/atom+xml" href="https://example.com/atom.xml" rel="alternate">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/atom.xml",
  },
  // JSON Feed 누락된 순서
  {
    name: "JSON Feed type→href→rel 순서의 링크를 추출할 수 있어야 함 (2)",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/feed+json" href="https://example.com/feed.json" rel="alternate">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.json",
  },
  // JSON 누락된 순서
  {
    name: "JSON type→href→rel 순서의 링크를 추출할 수 있어야 함 (2)",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/json" href="https://example.com/feed.json" rel="alternate">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/feed.json",
  },
  // RDF+XML (RSS 1.0) - 신규 MIME 타입
  {
    name: "RDF+XML (RSS 1.0) rel→type→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link rel="alternate" type="application/rdf+xml" href="https://example.com/rss10.rdf">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss10.rdf",
  },
  {
    name: "RDF+XML (RSS 1.0) type→rel→href 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/rdf+xml" rel="alternate" href="https://example.com/rss10.rdf">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss10.rdf",
  },
  {
    name: "RDF+XML (RSS 1.0) href→type 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link href="https://example.com/rss10.rdf" type="application/rdf+xml" rel="alternate">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss10.rdf",
  },
  {
    name: "RDF+XML (RSS 1.0) type→href→rel 순서의 링크를 추출할 수 있어야 함",
    blogUrl: "https://example.com",
    htmlContent: `
      <html>
        <head>
          <link type="application/rdf+xml" href="https://example.com/rss10.rdf" rel="alternate">
        </head>
      </html>
    `,
    expectedRssUrl: "https://example.com/rss10.rdf",
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

  describe("오탐 방지 (False Positive Prevention)", () => {
    it("rel='stylesheet'인 link 태그는 매칭되지 않아야 함", () => {
      const html = `
        <html>
          <head>
            <link rel="stylesheet" type="application/rss+xml" href="https://example.com/fake-rss">
          </head>
        </html>
      `;
      const result = parseRssUrlFromHtml(html, "https://example.com");
      expect(result).toBeNull();
    });

    it("rel 속성이 없는 link 태그는 매칭되지 않아야 함", () => {
      const html = `
        <html>
          <head>
            <link type="application/rss+xml" href="https://example.com/fake-rss">
          </head>
        </html>
      `;
      const result = parseRssUrlFromHtml(html, "https://example.com");
      expect(result).toBeNull();
    });

    it("rel='preload'인 link 태그는 매칭되지 않아야 함", () => {
      const html = `
        <html>
          <head>
            <link rel="preload" type="application/rss+xml" href="https://example.com/fake-rss" as="fetch">
          </head>
        </html>
      `;
      const result = parseRssUrlFromHtml(html, "https://example.com");
      expect(result).toBeNull();
    });

    it("rel='canonical'인 link 태그는 매칭되지 않아야 함", () => {
      const html = `
        <html>
          <head>
            <link rel="canonical" type="application/rss+xml" href="https://example.com/fake-rss">
          </head>
        </html>
      `;
      const result = parseRssUrlFromHtml(html, "https://example.com");
      expect(result).toBeNull();
    });
  });

  describe("우선순위 테스트", () => {
    it("RSS와 Atom이 동시에 있을 때 RSS가 우선 선택되어야 함", () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/atom+xml" href="https://example.com/atom.xml">
            <link rel="alternate" type="application/rss+xml" href="https://example.com/rss.xml">
          </head>
        </html>
      `;
      const result = parseRssUrlFromHtml(html, "https://example.com");
      expect(result).toBe("https://example.com/rss.xml");
    });

    it("Atom과 JSON Feed가 동시에 있을 때 Atom이 우선 선택되어야 함", () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/feed+json" href="https://example.com/feed.json">
            <link rel="alternate" type="application/atom+xml" href="https://example.com/atom.xml">
          </head>
        </html>
      `;
      const result = parseRssUrlFromHtml(html, "https://example.com");
      expect(result).toBe("https://example.com/atom.xml");
    });

    it("RSS, Atom, JSON Feed가 모두 있을 때 RSS가 우선 선택되어야 함", () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/feed+json" href="https://example.com/feed.json">
            <link rel="alternate" type="application/atom+xml" href="https://example.com/atom.xml">
            <link rel="alternate" type="application/rss+xml" href="https://example.com/rss.xml">
          </head>
        </html>
      `;
      const result = parseRssUrlFromHtml(html, "https://example.com");
      expect(result).toBe("https://example.com/rss.xml");
    });
  });
});

