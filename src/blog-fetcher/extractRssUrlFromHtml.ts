import ky from "ky";

/**
 * HTML 문자열에서 RSS URL 추출 (순수 함수)
 */
export function parseRssUrlFromHtml(
    html: string,
    baseUrl: string
): string | null {
    // RSS 피드 링크 패턴 찾기
    // <link rel="alternate" type="application/rss+xml" href="..."> 형식
    const rssLinkMatch =
        // RSS+XML (application/rss+xml)
        html.match(
            /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/rss\+xml["\'][^>]*href=["\']([^"\'>]+)["\']/i
        ) ||
        html.match(
            /<link[^>]*type=["\']application\/rss\+xml["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
        ) ||
        html.match(
            /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/rss\+xml["\']/i
        ) ||
        // Atom+XML (application/atom+xml)
        // <link rel="alternate" type="application/atom+xml" title="어쩐지 오늘은 Feed" href="https://zzsza.github.io/feed.xml">
        html.match(
            /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/atom\+xml["\'][^>]*href=["\']([^"\'>]+)["\']/i
        ) ||
        html.match(
            /<link[^>]*type=["\']application\/atom\+xml["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
        ) ||
        html.match(
            /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/atom\+xml["\']/i
        ) ||
        // JSON Feed (application/feed+json)
        html.match(
            /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/feed\+json["\'][^>]*href=["\']([^"\'>]+)["\']/i
        ) ||
        html.match(
            /<link[^>]*type=["\']application\/feed\+json["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
        ) ||
        html.match(
            /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/feed\+json["\']/i
        ) ||
        // JSON Feed (application/json) - JSON Feed를 사용하는 일부 사이트에서 사용
        html.match(
            /<link[^>]*rel=["\']alternate["\'][^>]*type=["\']application\/json["\'][^>]*href=["\']([^"\'>]+)["\']/i
        ) ||
        html.match(
            /<link[^>]*type=["\']application\/json["\'][^>]*rel=["\']alternate["\'][^>]*href=["\']([^"\'>]+)["\']/i
        ) ||
        html.match(
            /<link[^>]*href=["\']([^"\'>]+)["\''][^>]*type=["\']application\/json["\']/i
        );

    if (rssLinkMatch && rssLinkMatch[1]) {
        // 상대 URL을 절대 URL로 변환
        return new URL(rssLinkMatch[1], baseUrl).href;
    }

    return null;
}

/**
 * URL에서 HTML을 가져와 RSS URL 추출
 */
export async function extractRssUrlFromHtml(
    url: string
): Promise<string | null> {
    try {
        const html = await ky.get(url).text();
        return parseRssUrlFromHtml(html, url);
    } catch (error) {
        console.error("웹 페이지에서 RSS URL 추출 실패:", error);
        throw error;
    }
}
