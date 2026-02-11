import { D1Database } from '@cloudflare/workers-types';

/**
 * 조회수 증가 (UPSERT: 없으면 INSERT, 있으면 INCREMENT)
 */
export async function incrementViewCount(
  db: D1Database,
  blogReportId: number
): Promise<void> {
  await db
    .prepare(
      `
      INSERT INTO article_view_counts (blog_report_id, view_count, updated_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(blog_report_id) DO UPDATE SET
        view_count = view_count + 1,
        updated_at = CURRENT_TIMESTAMP
      `
    )
    .bind(blogReportId)
    .run();
}
