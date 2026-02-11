import { D1Database } from '@cloudflare/workers-types';

// 블로그 RSS 인터페이스
export interface BlogRss {
  id?: number;
  rss_url: string;
  blog_url: string;
  created_at?: string;
  updated_at?: string;
}

// 블로그 보고서 인터페이스
export interface BlogReport {
  id?: number;
  blog_rss_id: number;
  analysis_result: string;
  blog_title: string;
  created_at?: string;
}

// API 응답을 위한 통합 인터페이스
export interface BlogAnalysisResult {
  rssUrl: string;
  blogUrl: string;
  analysisResult: any; // 분석 결과는 JSON으로 파싱되어 반환됨
  createdAt: string;
}

/**
 * RSS URL로 블로그 정보를 조회하는 함수
 */
export async function getBlogRssByRssUrl(
  db: D1Database,
  rssUrl: string
): Promise<BlogRss | null> {
  const result = await db
    .prepare('SELECT * FROM blog_rss WHERE rss_url = ?')
    .bind(rssUrl)
    .first<BlogRss>();

  return result || null;
}

/**
 * 블로그 RSS 정보를 저장하거나 업데이트하는 함수
 */
export async function saveBlogRss(
  db: D1Database,
  data: { rss_url: string; blog_url: string }
): Promise<BlogRss> {
  const { rss_url, blog_url } = data;

  // 기존 블로그 RSS가 있는지 확인
  const existingBlogRss = await getBlogRssByRssUrl(db, rss_url);

  if (existingBlogRss) {
    // 기존 블로그 RSS 업데이트
    await db
      .prepare(
        'UPDATE blog_rss SET blog_url = ?, updated_at = CURRENT_TIMESTAMP WHERE rss_url = ?'
      )
      .bind(blog_url, rss_url)
      .run();

    return {
      ...existingBlogRss,
      blog_url,
      updated_at: new Date().toISOString(),
    };
  } else {
    // 새 블로그 RSS 생성
    const result = await db
      .prepare(
        'INSERT INTO blog_rss (rss_url, blog_url) VALUES (?, ?) RETURNING *'
      )
      .bind(rss_url, blog_url)
      .first<BlogRss>();

    if (!result) {
      throw new Error('블로그 RSS 저장에 실패했습니다.');
    }

    return result;
  }
}

/**
 * 블로그 RSS ID로 최신 분석 결과를 조회하는 함수
 */
export async function getLatestReportByBlogRssId(
  db: D1Database,
  blogRssId: number
): Promise<BlogReport | null> {
  const result = await db
    .prepare(
      'SELECT * FROM blog_report_v2 WHERE blog_rss_id = ? ORDER BY created_at DESC LIMIT 1'
    )
    .bind(blogRssId)
    .first<BlogReport>();

  return result || null;
}

/**
 * RSS URL로 최신 분석 결과를 조회하는 함수
 */
export async function getLatestAnalysisByRssUrl(
  db: D1Database,
  rssUrl: string
): Promise<BlogAnalysisResult | null> {
  // 조인 쿼리로 블로그 RSS와 최신 보고서를 함께 조회
  const result = await db
    .prepare(
      `
      SELECT b.rss_url, b.blog_url, r.analysis_result, r.created_at
      FROM blog_rss b
      JOIN blog_report_v2 r ON b.id = r.blog_rss_id
      WHERE b.rss_url = ?
      ORDER BY r.created_at DESC
      LIMIT 1
    `
    )
    .bind(rssUrl)
    .first<{
      rss_url: string;
      blog_url: string;
      analysis_result: string;
      created_at: string;
    }>();

  if (!result) return null;

  return {
    rssUrl: result.rss_url,
    blogUrl: result.blog_url,
    analysisResult: JSON.parse(result.analysis_result),
    createdAt: result.created_at,
  };
}

/**
 * 블로그 URL로 최신 분석 결과를 조회하는 함수
 */
export async function getLatestAnalysisByUrl(
  db: D1Database,
  blogUrl: string
): Promise<BlogAnalysisResult | null> {
  // 조인 쿼리로 블로그 RSS와 최신 보고서를 함께 조회
  const result = await db
    .prepare(
      `
      SELECT b.rss_url, b.blog_url, r.analysis_result, r.created_at
      FROM blog_rss b
      JOIN blog_report_v2 r ON b.id = r.blog_rss_id
      WHERE b.blog_url = ?
      ORDER BY r.created_at DESC
      LIMIT 1
    `
    )
    .bind(blogUrl)
    .first<{
      rss_url: string;
      blog_url: string;
      analysis_result: string;
      created_at: string;
    }>();

  if (!result) return null;

  return {
    rssUrl: result.rss_url,
    blogUrl: result.blog_url,
    analysisResult: JSON.parse(result.analysis_result),
    createdAt: result.created_at,
  };
}

/**
 * 블로그 분석 결과를 저장하는 함수
 */
export async function saveAnalysisResult(
  db: D1Database,
  data: {
    rss_url: string;
    blog_url: string;
    analysis_result: string;
    blog_title: string;
  }
): Promise<BlogAnalysisResult> {
  const { rss_url, blog_url, analysis_result, blog_title } = data;

  // 1. 블로그 RSS 저장 또는 업데이트
  const blogRss = await saveBlogRss(db, { rss_url, blog_url });

  if (!blogRss.id) {
    throw new Error('블로그 RSS ID를 가져올 수 없습니다.');
  }

  // 2. 블로그 분석 보고서 저장 (v2 테이블에 저장, blog_title 포함)
  const reportResult = await db
    .prepare(
      'INSERT INTO blog_report_v2 (blog_rss_id, analysis_result, blog_title) VALUES (?, ?, ?) RETURNING *'
    )
    .bind(blogRss.id, analysis_result, blog_title)
    .first<BlogReport>();

  if (!reportResult) {
    throw new Error('분석 결과 저장에 실패했습니다.');
  }

  // 3. 통합 결과 반환
  return {
    rssUrl: rss_url,
    blogUrl: blog_url,
    analysisResult: JSON.parse(analysis_result),
    createdAt: reportResult.created_at || new Date().toISOString(),
  };
}
