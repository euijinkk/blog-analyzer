ALTER TABLE blog_report_v2 
ADD COLUMN blog_title TEXT NOT NULL DEFAULT '';  

CREATE INDEX idx_blog_report_v2_blog_title ON blog_report_v2(blog_title);