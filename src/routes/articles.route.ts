import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as Sentry from '@sentry/cloudflare';
import { getArticleList } from '../db/articles';
import { ArticleQuerySchema } from '../types/articles.types';
import { calculateTopTendency } from '../utils/tendency-calculator';
import type { Env } from '../index';

const articlesRoute = new Hono<{ Bindings: Env }>();

articlesRoute.get('/', zValidator('query', ArticleQuerySchema), async (c) => {
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
        representativePostTitle: analysisResult.representativePost.title,
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
    return c.json({ error: '게시글 목록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

export default articlesRoute;
