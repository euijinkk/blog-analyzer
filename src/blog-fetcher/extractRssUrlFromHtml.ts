import ky from "ky";

/**
 * HTML 페이지에서 RSS 피드 URL을 추출
 */
export async function extractRssUrlFromHtml(
    url: string
): Promise<string | null> {
    try {
        // 웹 페이지 가져오기
        const response = await ky.get(url).text();

        // RSS 피드 링크 패턴 찾기
        // 1. <link rel="alternate" type="application/rss+xml" href="..."> 형식
        const rssLinkMatch =
            // RSS+XML (application/rss+xml)
            response.match(
                /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/rss\+xml["\'][^>]*href=["\']([^"\'>]+)["\']/i
            ) ||
            response.match(
                /<link[^>]*type=["\']application\/rss\+xml["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
            ) ||
            response.match(
                /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/rss\+xml["\']/i
            ) ||
            // Atom+XML (application/atom+xml)
            // <link rel="alternate" type="application/atom+xml" title="어쩐지 오늘은 Feed" href="https://zzsza.github.io/feed.xml">
            response.match(
                /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/atom\+xml["\'][^>]*href=["\']([^"\'>]+)["\']/i
            ) ||
            response.match(
                /<link[^>]*type=["\']application\/atom\+xml["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
            ) ||
            response.match(
                /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/atom\+xml["\']/i
            ) ||
            // JSON Feed (application/feed+json)
            response.match(
                /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/feed\+json["\'][^>]*href=["\']([^"\'>]+)["\']/i
            ) ||
            response.match(
                /<link[^>]*type=["\']application\/feed\+json["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
            ) ||
            response.match(
                /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/feed\+json["\']/i
            ) ||
            // JSON Feed (application/json) - JSON Feed를 사용하는 일부 사이트에서 사용
            response.match(
                /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/json["\'][^>]*href=["\']([^"\'>]+)["\']/i
            ) ||
            response.match(
                /<link[^>]*type=["\']application\/json["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
            ) ||
            response.match(
                /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/json["\']/i
            );

        if (rssLinkMatch && rssLinkMatch[1]) {
            // 상대 URL을 절대 URL로 변환
            const rssUrl = new URL(rssLinkMatch[1], url).href;
            return rssUrl;
        }

        // 2. 원하는 RSS 링크를 찾지 못한 경우
        return null;
    } catch (error) {
        console.error("웹 페이지에서 RSS URL 추출 실패:", error);
        throw error;
    }
}
