import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import OpenAI from 'openai';
import { getBlogPostsFromRSS } from './blog-fetcher/getBlogPostsFromRSS';
import { buildAnalysisContent } from './blog-fetcher/parse-blog';
import { z } from 'zod';
import { cors } from 'hono/cors';
import { getRssFromUrl } from './blog-fetcher/getRssFromUrl';
import { analyzeBlogContent } from './gen-ai/blog-analysis';
import { ipRateLimiter } from './middlewares/ipRateLimiter';
import {
  getLatestAnalysisByRssUrl,
  saveAnalysisResult,
} from './db/blog-analysis';
import { getArticleList } from './db/article-list';
import { incrementViewCount } from './db/article-view-counts';
import { ArticleQuerySchema } from './types/article-list';
import { calculateTopTendency } from './utils/tendency-calculator';
import { D1Database } from '@cloudflare/workers-types';
import * as Sentry from '@sentry/cloudflare';

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

function getAllowedOrigins(isProd: boolean): string[] {
  const localOrigins = [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  return isProd
    ? ['https://blog-analyzer.pages.dev', ...localOrigins]
    : localOrigins;
}

export default Sentry.withSentry(
  (env) => ({
    dsn: 'https://7776e15d89cc7d29a34e1d6b09e7415c@o4507096805015552.ingest.us.sentry.io/4509118221254656',
    release: 'blog-ai-analyzer@1.0.0', // 릴리스 식별자 추가
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

      // CORS 설정 - 개발 및 프로덕션 환경 구분
      const isProd = env.NODE_ENV === 'production';
      app.use(
        '*',
        cors({
          origin: getAllowedOrigins(isProd),
          allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
        })
      );

      // API 엔드포인트에 IP 요청 제한 적용
      app.use('/analyze', ipRateLimiter());

      app.get(
        '/articles',
        zValidator('query', ArticleQuerySchema),
        async (c) => {
          try {
            const query = c.req.valid('query');
            const db = c.env.DB;

            const { rows, total } = await getArticleList(db, query);

            const analyses = rows.map((row) => {
              const analysisResult = JSON.parse(row.analysis_result);

              return {
                id: row.id.toString(),
                blogUrl: row.blog_url,
                characterName: analysisResult.character.animal,
                authorName: row.blog_title,
                mbti: analysisResult.mbtiPrediction.result,
                representativePostTitle:
                  analysisResult.representativePost.title,
                topTendency: calculateTopTendency(analysisResult),
                characterSummary: analysisResult.character.summary,
                viewCount: row.view_count,
                createdAt: row.created_at,
              };
            });

            return c.json({
              analyses,
              total,
              hasMore: total > query.limit,
            });
          } catch (error) {
            console.log('error', error);
            Sentry.captureException(error);
            return c.json(
              { error: '게시글 목록 조회 중 오류가 발생했습니다.' },
              500
            );
          }
        }
      );

      app.post(
        '/analyze',
        zValidator(
          'json',
          z.object({
            blogUrl: z.string(),
          })
        ),
        async (c) => {
          try {
            const { blogUrl } = c.req.valid('json');
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
              ctx.waitUntil(incrementViewCount(db, existingAnalysis.reportId));
              return c.json(existingAnalysis.analysisResult);
            }

            // 2. 기존 결과가 없는 경우 새 분석 수행
            console.log(`새 분석 시작: ${rssUrl}`);
            const { posts, channelTitle } = await getBlogPostsFromRSS(rssUrl);
            const blogContent = buildAnalysisContent({ blogPosts: posts });

            // Gemini API 호출을 분리된 함수로 대체
            const analysisResult = await analyzeBlogContent({
              blogContent,
              apiKey: env.GEMINI_API_KEY,
            });

            // 3. 분석 결과를 DB에 저장 (RSS URL 기준, 블로그 제목 포함)
            const savedResult = await saveAnalysisResult(db, {
              rss_url: rssUrl,
              blog_url: blogUrl,
              analysis_result: JSON.stringify(analysisResult),
              blog_title: channelTitle,
            });

            ctx.waitUntil(incrementViewCount(db, savedResult.reportId));

            return c.json(analysisResult);
          } catch (error) {
            Sentry.captureException(error);

            // 오류 메시지 추출
            let errorMessage = '서버 오류가 발생했습니다';
            if (error instanceof Error) {
              errorMessage = error.message;
            }

            // 400 Bad Request 상태코드와 구조화된 오류 메시지 반환
            return c.body(errorMessage, 400);
          }
        }
      );

      return app.fetch(request, env, ctx);
    },
  } satisfies ExportedHandler<Env>
);
