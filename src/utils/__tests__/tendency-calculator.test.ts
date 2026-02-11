import { describe, expect, it } from 'vitest';
import { calculateTopTendency } from '../tendency-calculator';

function makeBlogTendency(scores: {
  nightMorning: number;
  narrativeImpact: number;
  trendEssence: number;
  communicationUnilateral: number;
  completeGrowth: number;
}) {
  return {
    blogTendency: {
      nightMorning: {
        score: scores.nightMorning,
        label: '',
        description: '',
      },
      narrativeImpact: {
        score: scores.narrativeImpact,
        label: '',
        description: '',
      },
      trendEssence: {
        score: scores.trendEssence,
        label: '',
        description: '',
      },
      communicationUnilateral: {
        score: scores.communicationUnilateral,
        label: '',
        description: '',
      },
      completeGrowth: {
        score: scores.completeGrowth,
        label: '',
        description: '',
      },
    },
  };
}

describe('calculateTopTendency', () => {
  it('가장 큰 deviation을 가진 축을 선택한다', () => {
    const result = calculateTopTendency(
      makeBlogTendency({
        nightMorning: 92,
        narrativeImpact: 60,
        trendEssence: 55,
        communicationUnilateral: 45,
        completeGrowth: 50,
      })
    );

    expect(result).toEqual({
      label: '밤형',
      score: 92,
      axisName: 'nightMorning',
    });
  });

  it('score < 50인 경우 right 라벨을 반환한다', () => {
    const result = calculateTopTendency(
      makeBlogTendency({
        nightMorning: 50,
        narrativeImpact: 50,
        trendEssence: 10,
        communicationUnilateral: 50,
        completeGrowth: 50,
      })
    );

    expect(result).toEqual({
      label: '본질형',
      score: 10,
      axisName: 'trendEssence',
    });
  });

  it('동점 시 첫 번째 축을 선택한다', () => {
    const result = calculateTopTendency(
      makeBlogTendency({
        nightMorning: 80,
        narrativeImpact: 80,
        trendEssence: 50,
        communicationUnilateral: 50,
        completeGrowth: 50,
      })
    );

    expect(result).toEqual({
      label: '밤형',
      score: 80,
      axisName: 'nightMorning',
    });
  });

  it('극단값 score=0 처리', () => {
    const result = calculateTopTendency(
      makeBlogTendency({
        nightMorning: 50,
        narrativeImpact: 50,
        trendEssence: 50,
        communicationUnilateral: 0,
        completeGrowth: 50,
      })
    );

    expect(result).toEqual({
      label: '일방형',
      score: 0,
      axisName: 'communicationUnilateral',
    });
  });

  it('극단값 score=100 처리', () => {
    const result = calculateTopTendency(
      makeBlogTendency({
        nightMorning: 50,
        narrativeImpact: 50,
        trendEssence: 50,
        communicationUnilateral: 50,
        completeGrowth: 100,
      })
    );

    expect(result).toEqual({
      label: '완성형',
      score: 100,
      axisName: 'completeGrowth',
    });
  });

  it('모든 축이 50점이면 첫 번째 축을 선택한다', () => {
    const result = calculateTopTendency(
      makeBlogTendency({
        nightMorning: 50,
        narrativeImpact: 50,
        trendEssence: 50,
        communicationUnilateral: 50,
        completeGrowth: 50,
      })
    );

    expect(result).toEqual({
      label: '밤형',
      score: 50,
      axisName: 'nightMorning',
    });
  });
});
