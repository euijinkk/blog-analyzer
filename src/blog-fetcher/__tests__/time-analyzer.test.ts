import { describe, expect, it } from 'vitest';
import { analyzeWritingTime, determineTimeCategory, TimeDistribution } from '../../utils/time-analyzer';
import { RSS_BLOG_POSTS } from '../../../fixtures/BLOG_POSTS';

describe('analyzeWritingTime', () => {
    it('RSS 에서 글 게시 시간을 확인하여, 평균 글쓰기 시간과 시간대 분포를 계산한다.', () => {
        // Given
        const blogPosts = RSS_BLOG_POSTS;

        // When
        const result = analyzeWritingTime(blogPosts);

        // Then
        expect(result).toEqual({
            averageWritingTime: '22:49',
            timeCategory: '밤형',
            distribution: { morning: 0, afternoon: 0, evening: 3, night: 7 }
        });
    });
});

describe('determineTimeCategory', () => {
    it('시간 분포에 따라 시간 카테고리를 결정한다', () => {
        // Given
        const distribution: TimeDistribution = { morning: 0, afternoon: 0, evening: 3, night: 7 };

        // When
        const result = determineTimeCategory(distribution);

        // Then
        expect(result).toBe('밤형');
    })
})