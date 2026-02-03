import ky from "ky";

/**
 * 지원하는 피드 MIME 타입 (우선순위 순)
 */
const FEED_MIME_TYPES = [
    "application/rss+xml", // RSS 2.0
    "application/atom+xml", // Atom
    "application/rdf+xml", // RSS 1.0 (RDF)
    "application/feed+json", // JSON Feed 1.1
    "application/json", // JSON Feed 1.0
] as const;

/**
 * 특정 MIME 타입에 대한 정규식 패턴 생성
 * 모든 속성 순서 조합을 커버하는 4가지 패턴 반환
 */
function createPatternsForMimeType(mimeType: string): RegExp[] {
    const escapedType = mimeType.replace(/[+]/g, "\\+");
    return [
        // rel → type → href
        new RegExp(
            `<link[^>]*rel=["']alternate["'][^>]*type=["']${escapedType}["'][^>]*href=["']([^"'>]+)["']`,
            "i"
        ),
        // type → rel → href
        new RegExp(
            `<link[^>]*type=["']${escapedType}["'][^>]*rel=["']alternate["'][^>]*href=["']([^"'>]+)["']`,
            "i"
        ),
        // href → type (rel 위치 무관)
        new RegExp(
            `<link[^>]*href=["']([^"'>]+)["'][^>]*type=["']${escapedType}["']`,
            "i"
        ),
        // type → href (rel 위치 무관)
        new RegExp(
            `<link[^>]*type=["']${escapedType}["'][^>]*href=["']([^"'>]+)["']`,
            "i"
        ),
    ];
}

/**
 * HTML 문자열에서 RSS URL 추출 (순수 함수)
 */
export function parseRssUrlFromHtml(
    html: string,
    baseUrl: string
): string | null {
    // 각 MIME 타입에 대해 우선순위 순으로 검색
    for (const mimeType of FEED_MIME_TYPES) {
        const patterns = createPatternsForMimeType(mimeType);
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                // 상대 URL을 절대 URL로 변환
                return new URL(match[1], baseUrl).href;
            }
        }
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
