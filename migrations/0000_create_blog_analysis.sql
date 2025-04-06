-- 블로그 URL 정보 테이블
CREATE TABLE blog_url (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  rss_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 블로그 URL에 대한 인덱스 생성
CREATE INDEX idx_url ON blog_url(url);

-- 블로그 분석 보고서 테이블
CREATE TABLE blog_report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_url_id INTEGER NOT NULL,
  analysis_result TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_url_id) REFERENCES blog_url(id)
);

-- 블로그 URL ID에 대한 인덱스 생성
CREATE INDEX idx_blog_url_id ON blog_report(blog_url_id);

-- 생성 시간 기준으로 정렬하기 위한 인덱스
CREATE INDEX idx_report_created_at ON blog_report(created_at);
