/**
 * URL이 이미 RSS/Atom 피드 URL인지 확인
 *
 * RSS 표준 패턴:
 * - 경로: /rss, /rss.xml, /rss.json, /feed, /feed.xml, /atom.xml
 * - 쿼리 파라미터: ?feed=rss, ?format=rss
 */
export function isRssUrl(url: string): boolean {
    const lower = url.toLowerCase();

    // 경로 패턴: /rss, /feed, /atom.xml 등으로 끝나거나 ?, / 등으로 구분됨
    const pathPatterns = [
        /\/rss($|\/|\?)/,              // /rss, /rss/, /rss?...
        /\/rss\.(xml|json)($|\?)/,     // /rss.xml, /rss.json
        /\/feed($|\/|\?)/,              // /feed, /feed/, /feed?...
        /\/feed\.(xml|json)($|\?)/,    // /feed.xml, /feed.json
        /\/atom\.xml($|\?)/,            // /atom.xml
    ];

    // 쿼리 파라미터 패턴
    const queryPatterns = [
        /[\?&](feed|format|type)=rss/i,  // ?feed=rss, ?format=rss
    ];

    return (
        pathPatterns.some(pattern => pattern.test(lower)) ||
        queryPatterns.some(pattern => pattern.test(lower))
    );
}
