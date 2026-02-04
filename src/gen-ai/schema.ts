import { Type } from "@sinclair/typebox";

// 8개 동물 캐릭터
const AnimalCharacter = Type.Union([
  Type.Literal("앵무새"),
  Type.Literal("돌고래"),
  Type.Literal("카멜레온"),
  Type.Literal("매"),
  Type.Literal("강아지"),
  Type.Literal("늑대"),
  Type.Literal("올빼미"),
  Type.Literal("사자"),
]);

// 캐릭터화
const Character = Type.Object({
  animal: AnimalCharacter,
  summary: Type.String(), // "핫한 소식을 독자와 나누며 함께 진화하는 앵무새 블로거"
});

// 대표 글 + 핵심 문장
const RepresentativePost = Type.Object({
  title: Type.String(),
  link: Type.String({ format: "uri" }),
  coreSentence: Type.String(),
  explanation: Type.String(),
});

// 성향 축 (공통 구조)
const TendencyAxis = Type.Object({
  score: Type.Number({ minimum: 0, maximum: 100 }),
  label: Type.String(), // "밤형" | "아침형" 등
  description: Type.String(),
});

// 5개 성향 축
const BlogTendency = Type.Object({
  nightMorning: TendencyAxis,
  narrativeImpact: TendencyAxis,
  trendEssence: TendencyAxis,
  communicationUnilateral: TendencyAxis,
  completeGrowth: TendencyAxis,
});

// MBTI 각 축 확신도
const MBTIAxisConfidence = Type.Object({
  score: Type.Number({ minimum: 0, maximum: 100 }),
  selected: Type.String(), // "I" | "E" 등
  explanation: Type.String(),
});

// MBTI 예측
const MBTIPrediction = Type.Object({
  result: Type.Union([
    Type.Literal("ISTJ"),
    Type.Literal("ISFJ"),
    Type.Literal("INFJ"),
    Type.Literal("INTJ"),
    Type.Literal("ISTP"),
    Type.Literal("ISFP"),
    Type.Literal("INFP"),
    Type.Literal("INTP"),
    Type.Literal("ESTP"),
    Type.Literal("ESFP"),
    Type.Literal("ENFP"),
    Type.Literal("ENTP"),
    Type.Literal("ESTJ"),
    Type.Literal("ESFJ"),
    Type.Literal("ENFJ"),
    Type.Literal("ENTJ"),
  ]),
  confidence: Type.Object({
    "E/I": MBTIAxisConfidence,
    "S/N": MBTIAxisConfidence,
    "T/F": MBTIAxisConfidence,
    "J/P": MBTIAxisConfidence,
  }),
});

// 운세 항목
const FortuneItem = Type.Object({
  content: Type.String(), // "[구체적 상황] — [조언/결과]"
  basedOn: Type.String(), // 어떤 성향 기반인지
});

// 운세
const Fortune = Type.Object({
  warnings: Type.Array(FortuneItem, { minItems: 2, maxItems: 2 }),
  directions: Type.Array(FortuneItem, { minItems: 2, maxItems: 2 }),
});

// 최종 스키마
export const BlogAnalysisSchema = Type.Object({
  character: Character,
  representativePost: RepresentativePost,
  blogTendency: BlogTendency,
  mbtiPrediction: MBTIPrediction,
  fortune: Fortune,
});
