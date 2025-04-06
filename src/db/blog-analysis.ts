import { D1Database } from "@cloudflare/workers-types";

// 블로그 URL 인터페이스
export interface BlogUrl {
  id?: number;
  url: string;
  rss_url: string;
  created_at?: string;
  updated_at?: string;
}

// 블로그 보고서 인터페이스
export interface BlogReport {
  id?: number;
  blog_url_id: number;
  analysis_result: string;
  created_at?: string;
}

// API 응답을 위한 통합 인터페이스
export interface BlogAnalysisResult {
  blogUrl: string;
  rssUrl: string;
  analysisResult: any; // 분석 결과는 JSON으로 파싱되어 반환됨
  createdAt: string;
}

/**
 * URL로 블로그 정보를 조회하는 함수
 */
export async function getBlogUrlByUrl(db: D1Database, url: string): Promise<BlogUrl | null> {
  const result = await db
    .prepare('SELECT * FROM blog_url WHERE url = ?')
    .bind(url)
    .first<BlogUrl>();
  
  return result || null;
}

/**
 * 블로그 URL 정보를 저장하거나 업데이트하는 함수
 */
export async function saveBlogUrl(
  db: D1Database,
  data: { url: string; rss_url: string }
): Promise<BlogUrl> {
  const { url, rss_url } = data;
  
  // 기존 블로그 URL이 있는지 확인
  const existingBlogUrl = await getBlogUrlByUrl(db, url);
  
  if (existingBlogUrl) {
    // 기존 블로그 URL 업데이트
    await db
      .prepare('UPDATE blog_url SET rss_url = ?, updated_at = CURRENT_TIMESTAMP WHERE url = ?')
      .bind(rss_url, url)
      .run();
    
    return {
      ...existingBlogUrl,
      rss_url,
      updated_at: new Date().toISOString()
    };
  } else {
    // 새 블로그 URL 생성
    const result = await db
      .prepare('INSERT INTO blog_url (url, rss_url) VALUES (?, ?) RETURNING *')
      .bind(url, rss_url)
      .first<BlogUrl>();
    
    if (!result) {
      throw new Error('블로그 URL 저장에 실패했습니다.');
    }
    
    return result;
  }
}

/**
 * 블로그 URL ID로 최신 분석 결과를 조회하는 함수
 */
export async function getLatestReportByBlogUrlId(db: D1Database, blogUrlId: number): Promise<BlogReport | null> {
  const result = await db
    .prepare('SELECT * FROM blog_report WHERE blog_url_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(blogUrlId)
    .first<BlogReport>();
  
  return result || null;
}

/**
 * 블로그 URL로 최신 분석 결과를 조회하는 함수
 */
export async function getLatestAnalysisByUrl(db: D1Database, url: string): Promise<BlogAnalysisResult | null> {
  // 조인 쿼리로 블로그 URL과 최신 보고서를 함께 조회
  const result = await db
    .prepare(`
      SELECT b.url, b.rss_url, r.analysis_result, r.created_at
      FROM blog_url b
      JOIN blog_report r ON b.id = r.blog_url_id
      WHERE b.url = ?
      ORDER BY r.created_at DESC
      LIMIT 1
    `)
    .bind(url)
    .first<{ url: string, rss_url: string, analysis_result: string, created_at: string }>();
  
  if (!result) return null;
  
  return {
    blogUrl: result.url,
    rssUrl: result.rss_url,
    analysisResult: JSON.parse(result.analysis_result),
    createdAt: result.created_at
  };
}

/**
 * 블로그 분석 결과를 저장하는 함수
 */
export async function saveAnalysisResult(
  db: D1Database, 
  data: { url: string; rss_url: string; analysis_result: string }
): Promise<BlogAnalysisResult> {
  const { url, rss_url, analysis_result } = data;
  
  // 1. 블로그 URL 저장 또는 업데이트
  const blogUrl = await saveBlogUrl(db, { url, rss_url });
  
  if (!blogUrl.id) {
    throw new Error('블로그 URL ID를 가져올 수 없습니다.');
  }
  
  // 2. 블로그 분석 보고서 저장
  const reportResult = await db
    .prepare('INSERT INTO blog_report (blog_url_id, analysis_result) VALUES (?, ?) RETURNING *')
    .bind(blogUrl.id, analysis_result)
    .first<BlogReport>();
  
  if (!reportResult) {
    throw new Error('분석 결과 저장에 실패했습니다.');
  }
  
  // 3. 통합 결과 반환
  return {
    blogUrl: url,
    rssUrl: rss_url,
    analysisResult: JSON.parse(analysis_result),
    createdAt: reportResult.created_at || new Date().toISOString()
  };
}
