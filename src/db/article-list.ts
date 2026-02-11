import { D1Database } from '@cloudflare/workers-types';
import { ArticleDbRow, ArticleQuery } from '../types/article-list';

export async function getArticleList(
  db: D1Database,
  query: ArticleQuery
): Promise<{ rows: ArticleDbRow[]; total: number }> {
  const orderClause =
    query.sort === 'random' ? 'RANDOM()' : 'r.created_at DESC';

  const rows = await db
    .prepare(
      `
      SELECT
        r.id,
        b.blog_url,
        r.analysis_result,
        r.blog_title,
        r.created_at
      FROM blog_rss b
      JOIN blog_report_v2 r ON b.id = r.blog_rss_id
      WHERE r.blog_title IS NOT NULL
      ORDER BY ${orderClause}
      LIMIT ?
    `
    )
    .bind(query.limit)
    .all<ArticleDbRow>();

  const total = await getTotalArticleCount(db);

  return { rows: rows.results, total };
}

export async function getTotalArticleCount(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM blog_rss b
      JOIN blog_report_v2 r ON b.id = r.blog_rss_id
      WHERE r.blog_title IS NOT NULL
    `
    )
    .first<{ count: number }>();

  return result?.count ?? 0;
}
