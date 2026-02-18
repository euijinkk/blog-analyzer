import { XMLParser } from 'fast-xml-parser';
import { MAX_POSTS } from './constants';
import { RSSPostType } from './type';
import ky from 'ky';

const removeHtmlTags = (html: string) => {
  // 코드 블록을 임시로 저장하고 플레이스홀더로 대체
  const codeBlocks: string[] = [];
  let processedHtml = html.replace(
    /(<pre[^>]*>.*?<\/pre>)|(<code[^>]*>.*?<\/code>)/gs,
    (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    }
  );

  // 코드 블록 외의 HTML 태그 제거
  processedHtml = processedHtml
    .replace(/<[^>]+>/g, '') // HTML 태그 제거
    .replace(/&nbsp;/g, ' ') // &nbsp; 를 공백으로 변환
    .replace(/&quot;/g, '"') // &quot; 를 큰따옴표로 변환
    .replace(/&amp;/g, '&') // &amp; 를 &로 변환
    .replace(/\s+/g, ' '); // 연속된 공백을 하나로 변환

  // 코드 블록 복원
  codeBlocks.forEach((block, index) => {
    processedHtml = processedHtml.replace(`__CODE_BLOCK_${index}__`, block);
  });

  return processedHtml.trim();
};

/**
 * XML 텍스트를 파싱하여 posts와 channelTitle을 반환
 */
const parseXmlToRssPosts = (
  xmlText: string
): { posts: RSSPostType[]; channelTitle: string } => {
  // XML 파싱
  const parser = new XMLParser();
  const result = parser.parse(xmlText);

  // 채널 제목 추출
  const channelTitle = result.rss?.channel?.title ?? '';

  // RSS 피드의 구조에 따라 items 배열 접근
  const items = result.rss?.channel?.item.slice(0, MAX_POSTS) ?? [];

  // items가 단일 객체인 경우 배열로 변환
  const itemsArray: RSSPostType[] = Array.isArray(items) ? items : [items];

  // 각 item에서 필요한 정보 추출
  const posts = itemsArray.map((item) => ({
    title: item.title ?? '',
    author: item.author ?? '',
    description: removeHtmlTags(item.description ?? ''),
    pubDate: item.pubDate ?? '',
    link: item.link ?? '',
  }));

  return { posts, channelTitle };
};

/**
 * RSS URL에서 데이터 가져오기
 */
const fetchRssContent = async (rssUrl: string): Promise<string> => {
  const response = await ky.get(rssUrl);
  return response.text();
};

export const getBlogPostsFromRSS = async (
  rssUrl: string
): Promise<{ posts: RSSPostType[]; channelTitle: string }> => {
  try {
    // RSS 피드 가져오기
    const xmlText = await fetchRssContent(rssUrl);

    // XML 파싱 및 게시물 배열과 채널 제목 가져오기
    const { posts, channelTitle } = parseXmlToRssPosts(xmlText);

    return { posts, channelTitle };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`해당 블로그는 RSS 를 제대로 제공하지 않습니다.`);
    }

    throw new Error('해당 블로그는 RSS 를 제대로 제공하지 않습니다.');
  }
};
