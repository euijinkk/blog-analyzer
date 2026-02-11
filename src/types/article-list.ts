import { z } from 'zod';
import { BlogReport, BlogRss } from '../db/blog-analysis';

// Query 파라미터 검증 스키마
export const ArticleQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(12),
  sort: z.enum(['latest', 'random']).default('latest'),
});

export type ArticleQuery = z.infer<typeof ArticleQuerySchema>;

// DB JOIN 결과 row 타입 (blog_rss + blog_report_v2 + article_view_counts)
export type ArticleDbRow = Required<
  Pick<BlogReport, 'id' | 'analysis_result' | 'blog_title' | 'created_at'>
> &
  Pick<BlogRss, 'blog_url'> & {
    view_count: number;
  };

// topTendency 응답 타입
export interface TopTendency {
  label: string;
  score: number;
  axisName: string;
}

// 개별 분석 결과 응답 타입
export interface ArticleResponse {
  id: string;
  blogUrl: string;
  characterName: string;
  authorName: string;
  mbti: string;
  representativePostTitle: string;
  topTendency: TopTendency;
  characterSummary: string;
  viewCount: number;
  createdAt: string;
}

// API 전체 응답 타입
export interface ArticleListResponse {
  analyses: ArticleResponse[];
  total: number;
  hasMore: boolean;
}
