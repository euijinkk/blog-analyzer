import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import OpenAI from "openai";
import { getBlogPostsFromRSS } from "./blog-fetcher/getBlogPostsFromRSS";
import { parseBlogIntoString } from "./blog-fetcher/parse-blog";
import { z } from "zod";
import { cors } from "hono/cors";
import { getRssFromUrl } from "./blog-fetcher/getRssFromUrl";
import { analyzeBlogContent } from "./gen-ai/blog-analysis";

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

    // origin
    app.use("*", cors({ origin: "*" }));

    app.get("/", (c) => {
      return c.text("Hello Hono!");
    });

    app.get("/parse-blog", async (c) => {
      const res = await getBlogPostsFromRSS("https://happysisyphe.tistory.com");

      console.log("res", res);

      return c.json(res);
    });

    app.post(
      "/analyze",
      zValidator(
        "json",
        z.object({
          blogUrl: z.string(),
        })
      ),
      async (c) => {
        const { blogUrl } = c.req.valid("json");
        const rssUrl = await getRssFromUrl(blogUrl);
        const blogPosts = await getBlogPostsFromRSS(rssUrl);
        const blogString = parseBlogIntoString({ blogPosts });
        console.log("blogString", blogString);

        // OpenAI API 호출을 분리된 함수로 대체
        const analysisResult = await analyzeBlogContent({
          blogContent: blogString,
          apiKey: env.OPENAI_API_KEY,
        });

        console.log("analysisResult", analysisResult);

        return c.body(analysisResult);
      }
    );

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
