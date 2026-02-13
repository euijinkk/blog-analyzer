ALTER TABLE blog_rss ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_blog_rss_is_hidden ON blog_rss(is_hidden);
