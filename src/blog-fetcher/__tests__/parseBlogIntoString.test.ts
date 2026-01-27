import { describe, expect, it } from "vitest";
import { parseBlogIntoString } from "../parse-blog";

const mockRSSData = Array.from({ length: 10 }, (_, index) => ({
    title: `title ${index + 1}`,
    author: `author ${index + 1}`,
    description: `description ${index + 1}`,
    pubDate: `pubDate ${index + 1}`,
    link: `link ${index + 1}`,
}))

describe("parseBlogIntoString", () => {
    it('RSS 데이터를 마크다운 텍스트로 변환한다', () => {
        // Given

        // When
        const result = parseBlogIntoString({ blogPosts: mockRSSData })
        const matches = result.match(/### 글 (\d+)/g);

        // Then
        expect(matches).toHaveLength(10);
        expect(matches).toEqual([
            '### 글 1',
            '### 글 2',
            '### 글 3',
            '### 글 4',
            '### 글 5',
            '### 글 6',
            '### 글 7',
            '### 글 8',
            '### 글 9',
            '### 글 10',
        ]);
    })
})
