import { Hono } from "hono";
import OpenAI from "openai";
import { BlogAnalysisSchema } from "./schema";
import { commonPrompt } from "./gen-ai/common-prompt";
import { fetchTistoryPostsByRSS } from "./blog-fetcher/platform/tistory";
import { parseBlogIntoString } from "./blog-fetcher/parse-blog";

/**
 * TODO:
 * 2. 응답과 연결시키기
 * 3. 응답 톤 조절하기
 */

interface Env {
  OPENAI_API_KEY: string;
}

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
      const res = await fetchTistoryPostsByRSS(
        "https://happysisyphe.tistory.com"
      );

      console.log("res", res);

      return c.json(res);
    });

    app.get("/analyze", async (c) => {
      const blogPosts = await fetchTistoryPostsByRSS(
        "https://happysisyphe.tistory.com"
      );
      const blogString = parseBlogIntoString({ blogPosts });
      console.log("blogString", blogString);

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: commonPrompt },
          {
            role: "user",
            content: blogString,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "output",
            description: "분석 리포트 결과",
            schema: BlogAnalysisSchema,
          },
        },
      });

      console.log("completion", completion);

      return c.body(completion.choices[0].message.content ?? "");
    });

    app.get("/test", async (c) => {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
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
function fetchBlogPosts(arg0: string) {
  throw new Error("Function not implemented.");
}
