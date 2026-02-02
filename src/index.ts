import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import OpenAI from "openai";
import { getBlogPostsFromRSS } from "./blog-fetcher/getBlogPostsFromRSS";
import { parseBlogIntoString } from "./blog-fetcher/parse-blog";
import { z } from "zod";
import { cors } from "hono/cors";
import { getRssFromUrl } from "./blog-fetcher/getRssFromUrl";
import { analyzeBlogContent } from "./gen-ai/blog-analysis";
import { ipRateLimiter } from "./middlewares/ipRateLimiter";
import {
  getLatestAnalysisByRssUrl,
  getLatestAnalysisByUrl,
  saveAnalysisResult,
} from "./db/blog-analysis";
import { D1Database } from "@cloudflare/workers-types";

import * as Sentry from "@sentry/cloudflare";

/**
 * TODO:
 * 2. 응답과 연결시키기
 * 3. 응답 톤 조절하기
 */

interface Env {
  OPENAI_API_KEY: string;
  GEMINI_API_KEY: string;
  RATE_LIMITS: KVNamespace;
  DB: D1Database;
  NODE_ENV?: string; // 개발 및 프로덕션 환경 구분을 위한 환경 변수
}

export default Sentry.withSentry(
  (env) => ({
    dsn: "https://7776e15d89cc7d29a34e1d6b09e7415c@o4507096805015552.ingest.us.sentry.io/4509118221254656",
    release: "blog-ai-analyzer@1.0.0", // 릴리스 식별자 추가
    tracesSampleRate: 1.0,
    attachStacktrace: true,
  }),
  {
    async fetch(
      request: Request,
      env: Env,
      ctx: ExecutionContext
    ): Promise<Response> {
      const app = new Hono<{ Bindings: Env }>();

      const client: OpenAI = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

      // CORS 설정 - 개발 및 프로덕션 환경 구분
      const isProd = env.NODE_ENV === "production";

      const allowedOrigins = isProd
        ? [
          "https://blog-analyzer.pages.dev",
          "http://localhost:3000",
          "http://localhost:4000",
          "http://localhost:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
        ]
        : [
          "http://localhost:3000",
          "http://localhost:4000",
          "http://localhost:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
        ];

      app.use(
        "*",
        cors({
          origin: allowedOrigins,
          allowMethods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
        })
      );

      // API 엔드포인트에 IP 요청 제한 적용
      app.use("/analyze", ipRateLimiter());

      app.get("/", (c) => {
        return c.text("Hello Hono!");
      });

      app.get("/sentry-error", async (c) => {
        try {
          await getRssFromUrl("https://test.com");
          return c.text("성공 (이 메시지는 보이지 않을 것입니다)");
        } catch (e) {
          // 에러를 캡처한 후 다시 던져서 스택 트레이스를 완전하게 유지
          Sentry.captureException(e);
        }
      });

      app.use("/ip-rate", ipRateLimiter());
      app.get("/ip-rate", (c) => {
        return c.body("test");
      });

      app.get("/parse-blog", async (c) => {
        const res = await getBlogPostsFromRSS(
          "https://happysisyphe.tistory.com"
        );

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
          try {
            const { blogUrl } = c.req.valid("json");
            const db = c.env.DB;

            // RSS URL을 가져옴
            const rssUrl = await getRssFromUrl(blogUrl);

            // 1. DB에서 기존 분석 결과 확인 (RSS URL 기준)
            const existingAnalysis = await getLatestAnalysisByRssUrl(
              db,
              rssUrl
            );
            if (existingAnalysis) {
              console.log(`기존 분석 결과 반환: ${rssUrl}`);
              return c.json(existingAnalysis.analysisResult);
            }

            // 2. 기존 결과가 없는 경우 새 분석 수행
            console.log(`새 분석 시작: ${rssUrl}`);
            const blogPosts = await getBlogPostsFromRSS(rssUrl);
            const blogString = parseBlogIntoString({ blogPosts });

            // Gemini API 호출을 분리된 함수로 대체
            const analysisResult = await analyzeBlogContent({
              blogContent: blogString,
              apiKey: env.GEMINI_API_KEY,
            });

            // 3. 분석 결과를 DB에 저장 (RSS URL 기준)
            await saveAnalysisResult(db, {
              rss_url: rssUrl,
              blog_url: blogUrl,
              analysis_result: JSON.stringify(analysisResult),
            });

            return c.json(analysisResult);
          } catch (error) {
            Sentry.captureException(error);

            // 오류 메시지 추출
            let errorMessage = "서버 오류가 발생했습니다";
            if (error instanceof Error) {
              errorMessage = error.message;
            }

            // 400 Bad Request 상태코드와 구조화된 오류 메시지 반환
            return c.body(errorMessage, 400);
          }
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
  } satisfies ExportedHandler<Env>
);
