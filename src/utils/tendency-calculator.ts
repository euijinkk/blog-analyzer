import { TopTendency } from '../types/article-list';
import { type BlogTendencyType } from '../gen-ai/schema';

const AXIS_LABELS: Record<
  keyof BlogTendencyType,
  { left: string; right: string }
> = {
  nightMorning: { left: '밤형', right: '아침형' },
  narrativeImpact: { left: '서사형', right: '임팩트형' },
  trendEssence: { left: '트렌드형', right: '본질형' },
  communicationUnilateral: { left: '소통형', right: '일방형' },
  completeGrowth: { left: '완성형', right: '성장형' },
};

const AXIS_KEYS = Object.keys(AXIS_LABELS) as (keyof BlogTendencyType)[];

export function calculateTopTendency(analysisResult: {
  blogTendency: BlogTendencyType;
}): TopTendency {
  const { blogTendency } = analysisResult;

  let maxDeviation = -1;
  let topAxisKey: keyof BlogTendencyType = AXIS_KEYS[0];

  for (const key of AXIS_KEYS) {
    const deviation = Math.abs(blogTendency[key].score - 50);
    if (deviation > maxDeviation) {
      maxDeviation = deviation;
      topAxisKey = key;
    }
  }

  const score = blogTendency[topAxisKey].score;
  const labels = AXIS_LABELS[topAxisKey];
  const label = score >= 50 ? labels.left : labels.right;

  return {
    label,
    score,
    axisName: topAxisKey,
  };
}
