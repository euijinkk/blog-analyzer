import { MAX_POSTS } from "../blog-fetcher/constants";

export const commonPrompt = `
아래는 ${MAX_POSTS}개의 블로그 글입니다. **전체 글을 종합적으로 분석**해 다음을 제공해 주세요.
- 인스타그램에서 사람들이 공유하고 싶어 할 만한 트렌디한 스타일로 표현해주세요
- 한국인을 대상으로 한 서비스이기 때문에, 한국어로 표현해주세요
- 분석 결과는 JSON 형식으로 반환해주세요

1. **성향 한 줄 요약(summary)** (ex: "유머러스한 유머리스트")  
  - AI는 사용자가 작성한 블로그 글을 **아래에 미리 정의된 형용사 목록과 캐릭터 목록**을 기준으로 분석합니다.  
  - 사용자 글의 **문체, 주제, 톤, 대상 독자**를 파악하여 가장 적합한 ‘형용사 + 캐릭터’ 조합 1개만 제시하세요.  
    - 예시: "냉철한 분석가", "창의적인 예술가" 등  
  - 제시하는 조합은 아래 형용사 목록, 캐릭터 목록에 있는 단어여야 합니다. 그렇지 않으면 오류로 간주합니다.

📌 **형용사 목록 (성향, 스타일) - 40개:**  
#### 감정/태도 관련 (Emotion/Attitude)  
- 낭만적인 (Romantic)  
- 진지한 (Serious)  
- 유머러스한 (Humorous)  
- 열정적인 (Passionate)  
- 냉철한 (Cold-headed)  
- 감성적인 (Emotional)  
- 격정적인 (Fierce)  
- 사려 깊은 (Thoughtful)  
- 긍정적인 (Positive)  
- 부정적인 (Negative)  
- 차분한 (Calm)  
- 불안한 (Anxious)  
- 탐구적인 (Inquisitive)  
- 호기심 많은 (Curious)  
- 낙천적인 (Optimistic)  
- 비관적인 (Pessimistic)  
- 통찰력 있는 (Insightful)  
- 공감하는 (Empathetic)  
- 솔직한 (Candid)  
- 도전적인 (Challenging)  

#### 스타일/문체 관련 (Style/Tone)  
- 실용적인 (Practical)  
- 분석적인 (Analytical)  
- 창의적인 (Creative)  
- 명확한 (Clear)  
- 철저한 (Thorough)  
- 상상력이 풍부한 (Imaginative)  
- 과감한 (Bold)  
- 직관적인 (Intuitive)  
- 논리적인 (Logical)  
- 독창적인 (Original)  
- 정교한 (Sophisticated)  
- 설득력 있는 (Persuasive)  
- 대담한 (Daring)  
- 간결한 (Concise)  
- 깊이 있는 (Deep)  
- 체계적인 (Systematic)  
- 유연한 (Flexible)  
- 직설적인 (Blunt)  
- 풍자적인 (Satirical)  
- 철학적인 (Philosophical)  

📌 **캐릭터 목록 (20개):**  
#### 지식 기반 캐릭터 (Knowledge-Based Characters)  
- 📚 철학자 (The Philosopher)  
- 📊 분석가 (The Analyst)  
- 💼 전문가 (The Expert)  
- 📝 교육자 (The Educator)  
- 📈 데이터 과학자 (The Data Scientist)  

#### 창의적 캐릭터 (Creative Characters)  
- 🎨 예술가 (The Artist)  
- 🖋 작가 (The Writer)  
- 🖌 디자이너 (The Designer)  
- 🌟 창조자 (The Creator)  
- 📖 이야기꾼 (The Storyteller)  

#### 유머 캐릭터 (Humorous Characters)  
- 🤪 유머리스트 (The Humorist)  
- 😈 풍자가 (The Satirist)  
- 🤡 익살꾼 (The Jester)  
- 🎭 패러디 작가 (The Parodist)  
- 📷 밈 마스터 (The Meme Master)  

#### 미래지향 캐릭터 (Futuristic Characters)  
- 🚀 미래주의자 (The Futurist)  
- 💡 혁신가 (The Innovator)  
- 🌍 모험가 (The Adventurer)  
- 🧭 개척자 (The Pioneer)  
- 🥊 도전자 (The Challenger)  

---
  
2. **성향 설명(summary_explanation)** (300자 이내)  
  - 작성 시 반드시 다음 요소들을 포함하여 설명해 주세요:  
    - 주제: 글에서 다루는 주요 내용이나 테마  
    - 핵심 메시지: 글이 전달하고자 하는 핵심 아이디어 또는 통찰  
    - 대상 독자: 글이 주로 겨냥하는 독자층  
    - 감성/톤: 글이 전달하는 분위기나 감성  
    - 설명은 300자 이내로, 정형화된 문장 패턴을 활용하여 작성해 주세요.  

3. **MBTI 예측(mbti)** (ex: "ENFP" 등으로 예상)  
  - **외향(E)/내향(I):** (1~2문장 설명, mbti_explanation)  
  - **감각(S)/직관(N):** (1~2문장 설명, mbti_explanation)  
  - **사고(T)/감정(F):** (1~2문장 설명, mbti_explanation)  
  - **판단(J)/인식(P):** (1~2문장 설명, mbti_explanation)  

4. **핵심 키워드(keywords)** (해시태그 형태로 3개 추천, 트렌디하고 공감 가는 키워드)  

5. **명언/핵심 문장 추천 (2개) (quotes)**  
   - 위 글들 중에서 명언 또는 핵심 문장을 찾아주세요. **생성하지 말고, 텍스트에서 정확히 존재하는 문장을 직접 추출하세요.**
   - 추출한 문장은 반드시 원본 글에서 실제로 존재해야 합니다. 원문과 모든 글자가 일치하는 문장이어야 합니다.
  - 정확히 존재하는 문장을 추출하지 않으면 오류로 간주합니다. 
   - 추출한 후보 문장들에 대해 **다음 평가 기준**을 적용하여 점수를 매긴 후, 상위 2개 문장을 최종 선택해 주세요 (quote):  
       1. **주제 적합성:** 해당 문장이 글의 주요 주제 및 핵심 메시지를 얼마나 잘 반영하는가.  
       2. **감정적 임팩트:** 독자의 감정을 자극하고, 인상 깊은 메시지를 전달하는 정도.  
   - 각 최종 선택된 문장에 대해, 위 기준을 종합하여 3~4문장으로 **선택 이유 및 맥락**을 상세히 설명해 주세요. (quote_explanation)
   - 해당 문장이 나온 블로그 글의 **링크(source_link)**도 함께 포함해 주세요.  

6. **글 소재 비율 분석(content_ratio)**  
  - 각 글에 대해 **1차적으로 해당 카테고리를 판별**하세요.  
  - 각 글에 산정한 카테고리를 기반으로, 전체 통계를 계산해주세요.  
  - 아래 4가지 카테고리 중 각 소재가 차지하는 비율을 계산해 주세요: (합은 100이 되어야 하고, 없으면 0으로 표시)  
     ✅ **전문분야 (expertise):** 개발, IT 기술, 의료, 금융, 디자인, 법률 등 특정 전문 지식이나 기술 관련 글  
     ✅ **에세이 (essay):** 개인의 경험, 삶의 통찰, 자기 성찰과 감정 중심 글  
     ✅ **여행 (travel):** 여행 경험, 장소 소개, 현지 문화/음식 추천 등  
     ✅ **자기계발 (self_improvement):** 학습법, 공부 습관, 독서, 학문적 탐구 등  

📌 **균형 있는 분석 지침 추가**  
- 각 카테고리에 해당하는 글이 있는 경우, 해당 카테고리의 특징을 **분석 결과에서 반드시 반영**해 주세요.  
- **모든 콘텐츠 비율을 고려해** 설명을 고르게 반영해 주세요.  
- 한쪽 주제가 두드러지더라도, **다른 카테고리의 특징**을 최소 1회 이상 언급해 주세요.  
`;
