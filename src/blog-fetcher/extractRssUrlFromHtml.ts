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
 * rel="alternate", type, href 속성의 6가지 순서 조합을 모두 커버
 * 모든 패턴에서 rel="alternate" 검증 필수
 */
function createPatternsForMimeType(mimeType: string): RegExp[] {
    const escapedType = mimeType.replace(/[+]/g, "\\+");
    return [
        // 1. rel → type → href
        new RegExp(
            `<link[^>]*rel=["']alternate["'][^>]*type=["']${escapedType}["'][^>]*href=["']([^"'>]+)["']`,
            "i"
        ),
        // 2. rel → href → type
        new RegExp(
            `<link[^>]*rel=["']alternate["'][^>]*href=["']([^"'>]+)["'][^>]*type=["']${escapedType}["']`,
            "i"
        ),
        // 3. type → rel → href
        new RegExp(
            `<link[^>]*type=["']${escapedType}["'][^>]*rel=["']alternate["'][^>]*href=["']([^"'>]+)["']`,
            "i"
        ),
        // 4. type → href → rel
        new RegExp(
            `<link[^>]*type=["']${escapedType}["'][^>]*href=["']([^"'>]+)["'][^>]*rel=["']alternate["']`,
            "i"
        ),
        // 5. href → rel → type
        new RegExp(
            `<link[^>]*href=["']([^"'>]+)["'][^>]*rel=["']alternate["'][^>]*type=["']${escapedType}["']`,
            "i"
        ),
        // 6. href → type → rel
        new RegExp(
            `<link[^>]*href=["']([^"'>]+)["'][^>]*type=["']${escapedType}["'][^>]*rel=["']alternate["']`,
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
