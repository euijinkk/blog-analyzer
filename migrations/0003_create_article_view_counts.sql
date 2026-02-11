CREATE TABLE article_view_counts (
  blog_report_id INTEGER PRIMARY KEY,
  view_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_report_id) REFERENCES blog_report_v2(id)
);
