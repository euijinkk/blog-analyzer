import { Type } from "@sinclair/typebox";

const MBTIExplanation = Type.Object({
  "E/I": Type.String(),
  "S/N": Type.String(),
  "T/F": Type.String(),
  "J/P": Type.String(),
});

const Quote = Type.Object({
  quote: Type.String(),
  quote_explanation: Type.String(),
  source_link: Type.String({ format: "uri" }),
});

const ContentRatio = Type.Object({
  expertise: Type.String({ pattern: "^(\\d{1,2}|100)%$" }),
  essay: Type.String({ pattern: "^(\\d{1,2}|100)%$" }),
  travel: Type.String({ pattern: "^(\\d{1,2}|100)%$" }),
  self_improvement: Type.String({ pattern: "^(\\d{1,2}|100)%$" }),
});

export const BlogAnalysisSchema = Type.Object({
  summary: Type.String(),
  summary_explanation: Type.String(),
  mbti: Type.Union([
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
  mbti_explanation: MBTIExplanation,
  keywords: Type.Array(Type.String()),
  quotes: Type.Array(Quote),
  content_ratio: ContentRatio,
});
