import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ipRateLimiter } from './middlewares/ipRateLimiter';
import { D1Database } from '@cloudflare/workers-types';
import * as Sentry from '@sentry/cloudflare';
import analyzeRoute from './routes/analyze.route';
import articlesRoute from './routes/articles.route';
import adminRoute from './routes/admin.route';

/**
 * TODO:
 * 2. 응답과 연결시키기
 * 3. 응답 톤 조절하기
 */

export interface Env {
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

      app.route('/analyze', analyzeRoute);
      app.route('/articles', articlesRoute);
      app.route('/admin', adminRoute);

      return app.fetch(request, env, ctx);
    },
  } satisfies ExportedHandler<Env>
);
