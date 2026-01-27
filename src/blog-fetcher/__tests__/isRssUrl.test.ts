import { describe, it, expect } from "vitest";
import { isRssUrl } from "../isRssUrl";

describe("isRssUrl", () => {
    describe("적절한 RSS URL", () => {
        it.each([
            // /rss 패턴
            "https://example.com/rss",
            "https://example.com/rss/",
            "https://example.com/rss?page=1",

            // /rss.xml, /rss.json 패턴
            "https://example.com/rss.xml",
            "https://example.com/rss.json",
            "https://example.com/rss.xml?v=2",

            // /feed 패턴
            "https://example.com/feed",
            "https://example.com/feed/",
            "https://example.com/feed?page=1",

            // /feed.xml, /feed.json 패턴
            "https://example.com/feed.xml",
            "https://example.com/feed.json",

            // /atom.xml 패턴
            "https://example.com/atom.xml",
            "https://example.com/atom.xml?page=1",

            // /feeds/, /feed/, /atom/ 디렉토리 패턴
            "https://example.com/feeds/all.xml",
            "https://example.com/feeds/posts.json",
            "https://example.com/feed/@username",
            "https://medium.com/feed/@username",
            "https://example.com/atom/entries",

            // 쿼리 파라미터 패턴
            "https://example.com/blog?feed=rss",
            "https://example.com/blog?format=rss",
            "https://example.com/blog?type=rss",
            "https://example.com/blog?page=1&feed=rss",
            "https://example.com/blog?format=atom",
            "https://example.com/blog?type=json",

            // 대소문자 무시
            "https://example.com/RSS",
            "https://example.com/Feed.XML",
            "https://example.com/blog?FEED=RSS",
        ])("RSS URL로 판단해야 함: %s", (url) => {
            expect(isRssUrl(url)).toBe(true);
        });
    });

    describe("적절하지 않은 RSS URL", () => {
        it.each([
            // 호스트명에 'rss' 포함 (경로에는 없음)
            "https://myrss.tistory.com",
            "https://rss.example.com/blog",

            // 경로에 'feed' 포함되지만 정확하지 않음
            "https://example.com/feedback",
            "https://example.com/feedbacks",

            // 기타 XML 파일 (RSS 아님)
            "https://example.com/sitemap.xml",
            "https://example.com/styles.xml",
            "https://example.com/data.xml",

            // 일반 블로그 URL
            "https://example.tistory.com",
            "https://blog.naver.com/username",
            "https://velog.io/@username",

            // 쿼리 파라미터는 있지만 RSS 관련이 아님
            "https://example.com/blog?page=1",
            "https://example.com/blog?search=rss",
        ])("RSS URL이 아니어야 함: %s", (url) => {
            expect(isRssUrl(url)).toBe(false);
        });
    });
});
