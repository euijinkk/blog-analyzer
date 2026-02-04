-- 새 스펙용 분석 결과 테이블
CREATE TABLE blog_report_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_rss_id INTEGER NOT NULL,
  analysis_result TEXT NOT NULL,        -- 새 스펙 JSON 저장
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_rss_id) REFERENCES blog_rss(id)
);

CREATE INDEX idx_blog_report_v2_blog_rss_id ON blog_report_v2(blog_rss_id);
CREATE INDEX idx_blog_report_v2_created_at ON blog_report_v2(created_at);
