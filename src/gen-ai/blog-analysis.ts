import OpenAI from "openai";
import { BlogAnalysisSchema } from "./schema";
import { commonPrompt } from "./common-prompt";

/**
 * OpenAI 클라이언트를 생성합니다.
 * Cloudflare Workers에서는 환경변수를 env를 통해 접근하기 때문에 함수 파라미터로 전달받습니다.
 */
function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

/**
 * 블로그 분석을 위한 파라미터 타입
 */
type BlogAnalysisParams = {
  /** 분석할 블로그 내용 문자열 */
  blogContent: string;
  /** OpenAI API 키 */
  apiKey: string;
};

/**
 * 블로그 내용을 분석하여 인사이트를 추출합니다
 * @param params 분석 파라미터 객체
 * @returns 블로그 분석 결과 객체
 */
export async function analyzeBlogContent(
  params: BlogAnalysisParams
): Promise<Record<string, any>> {
  try {
    const { blogContent, apiKey } = params;
    const client = createOpenAIClient(apiKey);
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: commonPrompt },
        {
          role: "user",
          content: blogContent,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "output",
          description: "분석 리포트 결과",
          schema: BlogAnalysisSchema,
        },
      },
    });

    const resultContent = completion.choices[0].message.content ?? "";

    return JSON.parse(resultContent);
  } catch (error) {
    console.error("블로그 분석 중 오류 발생:", error);
    throw new Error("블로그 분석에 실패했습니다");
  }
}
