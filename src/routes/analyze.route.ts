import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as Sentry from '@sentry/cloudflare';
import { getRssFromUrl } from '../blog-fetcher/getRssFromUrl';
import { getBlogPostsFromRSS } from '../blog-fetcher/getBlogPostsFromRSS';
import { buildAnalysisContent } from '../blog-fetcher/parse-blog';
import { analyzeBlogContent } from '../gen-ai/blog-analysis';
import {
  getLatestAnalysisByRssUrl,
  saveAnalysisResult,
} from '../db/blog-analysis';
import { incrementViewCount } from '../db/article-view-counts';
import type { Env } from '../index';

const analyzeRoute = new Hono<{ Bindings: Env }>();

analyzeRoute.post(
  '/',
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

      const rssUrl = await getRssFromUrl(blogUrl);

      const existingAnalysis = await getLatestAnalysisByRssUrl(db, rssUrl);
      if (existingAnalysis) {
        console.log(`기존 분석 결과 반환: ${rssUrl}`);
        c.executionCtx.waitUntil(
          incrementViewCount(db, existingAnalysis.reportId)
        );
        return c.json(existingAnalysis.analysisResult);
      }

      console.log(`새 분석 시작: ${rssUrl}`);
      const { posts, channelTitle } = await getBlogPostsFromRSS(rssUrl);
      const blogContent = buildAnalysisContent({ blogPosts: posts });

      const analysisResult = await analyzeBlogContent({
        blogContent,
        apiKey: c.env.GEMINI_API_KEY,
      });

      const savedResult = await saveAnalysisResult(db, {
        rss_url: rssUrl,
        blog_url: blogUrl,
        analysis_result: JSON.stringify(analysisResult),
        blog_title: channelTitle,
      });

      c.executionCtx.waitUntil(incrementViewCount(db, savedResult.reportId));

      return c.json(analysisResult);
    } catch (error) {
      Sentry.captureException(error);

      let errorMessage = '서버 오류가 발생했습니다';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return c.body(errorMessage, 400);
    }
  }
);

export default analyzeRoute;
