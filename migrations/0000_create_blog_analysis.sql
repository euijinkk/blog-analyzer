-- 블로그 RSS 정보 테이블
CREATE TABLE blog_rss (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rss_url TEXT NOT NULL UNIQUE,
  blog_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RSS URL에 대한 인덱스 생성
CREATE INDEX idx_rss_url ON blog_rss(rss_url);

-- 블로그 URL에 대한 인덱스 생성
CREATE INDEX idx_blog_url ON blog_rss(blog_url);

-- 블로그 분석 보고서 테이블
CREATE TABLE blog_report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_rss_id INTEGER NOT NULL,
  analysis_result TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_rss_id) REFERENCES blog_rss(id)
);

-- 블로그 RSS ID에 대한 인덱스 생성
CREATE INDEX idx_blog_rss_id ON blog_report(blog_rss_id);

-- 생성 시간 기준으로 정렬하기 위한 인덱스
CREATE INDEX idx_report_created_at ON blog_report(created_at);
