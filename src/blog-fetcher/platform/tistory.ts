import { XMLParser } from "fast-xml-parser";
import { MAX_POST_LENGTH, MAX_POSTS } from "../constants";
import { RSSPostType } from "../type";
import ky from "ky";

export const fetchTistoryPostsByRSS = async (
  blogUrl: string
): Promise<RSSPostType[]> => {
  // 블로그 URL을 RSS URL로 변환
  const rssUrl = blogUrl.endsWith("/") ? `${blogUrl}rss` : `${blogUrl}/rss`;

  try {
    // RSS 피드 가져오기
    const response = await ky.get(rssUrl);
    const xmlText = await response.text();

    // XML 파싱
    const parser = new XMLParser();
    const result = parser.parse(xmlText);

    // RSS 피드의 구조에 따라 items 배열 접근
    const items = result.rss?.channel?.item.slice(0, MAX_POSTS) ?? [];

    // items가 단일 객체인 경우 배열로 변환
    const itemsArray: RSSPostType[] = Array.isArray(items) ? items : [items];

    // 각 item에서 필요한 정보 추출
    const posts = itemsArray.map((item) => ({
      title: item.title ?? "",
      author: item.author ?? "",
      description: item.description.slice(0, MAX_POST_LENGTH) ?? "",
      pubDate: item.pubDate ?? "",
      link: item.link ?? "",
    }));

    return posts;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    throw error;
  }
};
