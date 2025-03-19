import { Hono } from "hono";
import OpenAI from "openai";
import { XMLParser } from "fast-xml-parser";

interface BlogPost {
  title: string;
  author: string;
  description: string;
  pubDate: string;
}

interface Env {
  OPENAI_API_KEY: string;
}

const MAX_POSTS = 10;

// TODO: tag 제거
const fetchBlogPosts = async (blogUrl: string): Promise<BlogPost[]> => {
  // 블로그 URL을 RSS URL로 변환
  const rssUrl = blogUrl.endsWith("/") ? `${blogUrl}rss` : `${blogUrl}/rss`;

  try {
    // RSS 피드 가져오기
    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    // XML 파싱
    const parser = new XMLParser();
    const result = parser.parse(xmlText);

    // RSS 피드의 구조에 따라 items 배열 접근
    const items = result.rss?.channel?.item.slice(0, MAX_POSTS) ?? [];

    // items가 단일 객체인 경우 배열로 변환
    const itemsArray = Array.isArray(items) ? items : [items];

    // 각 item에서 필요한 정보 추출
    const posts: BlogPost[] = itemsArray.map((item) => ({
      title: item.title ?? "",
      author: item.author ?? "",
      description: item.description ?? "",
      pubDate: item.pubDate ?? "",
    }));

    return posts;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    throw error;
  }
};

const generatePrompt = ({ blogPosts }: { blogPosts: string[] }) => `
  다음은 블로그 글 10개의 본문입니다.  
  ${blogPosts.join("\n\n")}

  ### 요구사항
  1. 성향 한 줄 요약
  2. MBTI 예측
  3. 키워드 (해시태그 형태)
  4. 글 작성 주기 분석 (날짜: [2025-03-01, 2025-03-05, 2025-03-12, 2025-03-19, 2025-03-27, 2025-04-01])
  5. 명언/핵심 문장 추천

  ### 응답 형식 (JSON)
  {
    "summary": "...",
    "mbti": "...",
    "keywords": ["#..."],
    "writing_frequency": "...",
    "quotes": ["...", "..."]
  }
  `;

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const app = new Hono<{ Bindings: Env }>();

    const client: OpenAI = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    app.get("/", (c) => {
      return c.text("Hello Hono!");
    });

    app.get("/parse-blog", async (c) => {
      const res = await fetchBlogPosts("https://happysisyphe.tistory.com/");

      return c.json(res);
    });

    app.get("/test", async (c) => {
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Write a one-sentence bedtime story about a unicorn.",
          },
        ],
      });

      return c.body(completion.choices[0].message.content ?? "");
    });

    return app.fetch(request, env, ctx);
  },
};
