# Blog-AI-Analyzer 프로젝트 가이드

## 프로젝트 개요

Blog-AI-Analyzer는 다양한 블로그 플랫폼의 블로그를 AI를 활용하여 자동 분석하고 인사이트를 제공하는 웹 애플리케이션입니다.

### 핵심 기능
- 블로그 작가의 성향 및 MBTI 분석
- 핵심 키워드 자동 추출
- 명언/핵심 문장 발굴
- 콘텐츠 비율 분석 (전문분야/에세이/여행/자기계발)

### 지원 블로그 플랫폼
- 티스토리 (`*.tistory.com`)
- 네이버 블로그 (데스크톱 & 모바일)
- 벨로그 (`velog.io`)
- Medium (`medium.com`)
- Brunch (`brunch.co.kr`)
- 기타 RSS 제공 블로그 (자동 감지)

## 기술 스택

### 핵심 기술
- **런타임**: Cloudflare Workers (서버리스 엣지 컴퓨팅)
- **프레임워크**: Hono v4.7.4 (초경량 웹 프레임워크)
- **언어**: TypeScript
- **AI 모델**: Google Gemini 2.5 Flash
- **데이터베이스**: Cloudflare D1 (SQLite 기반)

### 주요 라이브러리
- **AI API**: @google/genai v1.38.0
- **데이터 검증**: Zod v3.24.2, TypeBox
- **HTML/XML 파싱**: cheerio v1.0.0, fast-xml-parser v5.0.9
- **HTTP 클라이언트**: ky v1.7.5
- **모니터링**: @sentry/cloudflare v9.12.0
- **테스트**: Vitest v3.1.1
- **프롬프트 테스트**: promptfoo

## 프로젝트 구조

```
src/
├── index.ts                    # 메인 서버 엔트리포인트 & API 라우팅
├── blog-fetcher/               # 블로그 데이터 수집 모듈
│   ├── getRssFromUrl.ts        # ⭐ 핵심: 블로그 URL → RSS URL 변환
│   ├── getBlogPostsFromRSS.ts  # RSS 피드 파싱 (최대 10개 포스트)
│   ├── parse-blog.ts           # 블로그 컨텐츠 문자열화
│   └── constants.ts            # 상수 (MAX_POSTS=10, MAX_POST_LENGTH=5000)
├── gen-ai/                     # AI 분석 모듈
│   ├── blog-analysis.ts        # ⭐ 핵심: Gemini API 호출
│   ├── common-prompt.ts        # ⭐ 핵심: 상세 분석 프롬프트
│   └── schema.ts               # JSON 스키마 (분석 결과 구조)
├── db/                         # 데이터베이스 레이어
│   └── blog-analysis.ts        # D1 쿼리 함수들 (캐싱 로직)
└── middlewares/
    └── ipRateLimiter.ts        # IP 기반 요청 제한 (시간당 20회)
```

### 중요 파일 설명

#### [getRssFromUrl.ts](src/blog-fetcher/getRssFromUrl.ts)
- 6가지 플랫폼별 RSS URL 추출 로직 구현
- HTML 헤더 파싱을 통한 RSS 링크 자동 감지
- 네이버 모바일 URL 특수 처리 포함

#### [blog-analysis.ts](src/gen-ai/blog-analysis.ts)
- Google Gemini 2.5 Flash API 호출
- JSON Schema 기반 구조화된 응답 강제
- 에러 핸들링 및 Sentry 리포트

#### [common-prompt.ts](src/gen-ai/common-prompt.ts)
- 40개의 형용사 목록 (감정/태도 20개, 스타일/문체 20개)
- 20개의 캐릭터 목록 (철학자, 분석가, 예술가 등)
- MBTI 16가지 유형별 분류 기준
- 엄격한 형식 지정 (경어체 한국어)

## API 엔드포인트

### POST `/analyze`
블로그 분석 요청

**요청 본문**:
```json
{
  "blogUrl": "https://example.tistory.com"
}
```

**응답**:
```json
{
  "summary": "냉철한 분석가",
  "summary_explanation": "...",
  "mbti": "INTJ",
  "mbti_explanation": {
    "E/I": "...",
    "S/N": "...",
    "T/F": "...",
    "J/P": "..."
  },
  "keywords": ["#개발", "#기술", "#통찰"],
  "quotes": [
    {
      "quote": "...",
      "quote_explanation": "...",
      "source_link": "..."
    }
  ],
  "content_ratio": {
    "expertise": "30%",
    "essay": "50%",
    "travel": "10%",
    "self_improvement": "10%"
  }
}
```

### 기타 엔드포인트
- `GET /parse-blog`: 티스토리 블로그 파싱 테스트
- `GET /sentry-error`: Sentry 에러 모니터링 테스트
- `GET /ip-rate`: 요청 제한 테스트

## 데이터베이스 스키마

### blog_rss 테이블
```sql
CREATE TABLE blog_rss (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rss_url TEXT NOT NULL UNIQUE,
  blog_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### blog_report 테이블
```sql
CREATE TABLE blog_report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_rss_id INTEGER NOT NULL,
  analysis_result TEXT NOT NULL,  -- JSON 형식
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_rss_id) REFERENCES blog_rss(id)
);
```

### 캐싱 전략
- 동일한 RSS URL에 대한 분석 결과는 DB에 저장
- 중복 분석 방지로 Gemini API 호출 최소화
- `blog_rss.rss_url`을 유니크 키로 사용

## 개발 워크플로우

### 로컬 개발
```bash
# 개발 서버 실행 (Hot reload)
npm run dev

# 로컬 테스트 URL
http://localhost:5173/report?blog-url=https://jojoldu.tistory.com/
```

### 테스트
```bash
# 단위 테스트 실행
npm test

# 테스트 커버리지
npm test -- --coverage
```

### 빌드 및 배포
```bash
# 전체 배포 프로세스 (빌드 + Sentry + 배포)
npm run deploy

# 단계별 명령어
npm run build              # 빌드만
npm run sentry:inject      # 소스맵 주입
wrangler deploy            # Cloudflare Workers 배포
npm run sentry:upload      # Sentry 소스맵 업로드
```

### 데이터베이스 마이그레이션
```bash
# D1 데이터베이스 마이그레이션 적용
wrangler d1 migrations apply BLOG_ANALYZER_DB
```

## 코딩 컨벤션 및 베스트 프랙티스

### 타입 안정성
- 모든 API 요청/응답에 Zod 스키마 사용
- AI 응답은 TypeBox 스키마로 검증
- `any` 타입 사용 금지

### 에러 핸들링
- 모든 비동기 함수는 try-catch로 감싸기
- 사용자 친화적인 에러 메시지 반환
- 서버 에러는 Sentry로 자동 리포트

```typescript
try {
  // 비즈니스 로직
} catch (error) {
  captureException(error);
  return c.json({ error: '블로그 분석 중 오류가 발생했습니다.' }, 500);
}
```

### 프롬프트 엔지니어링
- `common-prompt.ts`의 프롬프트 수정 시 신중하게 접근
- 변경 후 promptfoo로 테스트 필수
- 형용사/캐릭터 목록 수정 시 JSON 스키마도 함께 업데이트

### RSS URL 추출 로직
- 새로운 플랫폼 추가 시 `getRssFromUrl.ts`에 패턴 추가
- 테스트 케이스 작성 필수 (`getRssFromUrl.test.ts`)
- 절대 URL 변환 잊지 않기 (상대 경로 처리)

## 환경 변수 및 비밀

### Cloudflare Workers 환경 변수
- `GEMINI_API_KEY`: Google Gemini API 키
- `SENTRY_DSN`: Sentry 프로젝트 DSN

### Wrangler 설정 ([wrangler.jsonc](wrangler.jsonc))
```jsonc
{
  "name": "blog-ai-analyzer",
  "main": "dist/index.js",
  "compatibility_date": "2024-10-25",
  "d1_databases": [
    {
      "binding": "BLOG_ANALYZER_DB",
      "database_name": "blog-analyzer-db",
      "database_id": "..."
    }
  ],
  "kv_namespaces": [
    {
      "binding": "RATE_LIMITER",
      "id": "..."
    }
  ]
}
```

## 성능 최적화

### 요청 제한
- IP 기반 시간당 20회 제한
- Cloudflare KV 스토어 활용
- 헤더로 남은 요청 수 반환 (`X-RateLimit-Remaining`)

### 콘텐츠 제한
- RSS에서 최대 10개 포스트만 분석
- 포스트당 최대 5000자로 제한
- HTML 태그 제거 (코드 블록은 보존)

### 캐싱
- 동일 RSS URL 분석 결과 재사용
- DB 조회 후 없을 때만 AI API 호출

## 모니터링 및 로깅

### Sentry 통합
- 에러 자동 추적 및 알림
- 소스맵 자동 업로드
- 100% 트레이스 샘플링
- 릴리스 버전: `blog-ai-analyzer@1.0.0`

### 로그 확인
```bash
# Cloudflare Workers 로그 실시간 확인
wrangler tail
```

## 프롬프트 테스트 (Promptfoo)

### 테스트 실행
```bash
# Promptfoo를 사용한 프롬프트 성능 테스트
npx promptfoo eval
```

### 테스트 케이스 추가
- `promptfooconfig.yaml`에 테스트 케이스 정의
- MBTI 분류 정확도, 형용사 선택 적절성 등 검증

## 알려진 이슈 및 제약사항

### RSS 파싱 제한
- RSS 피드를 제공하지 않는 블로그는 분석 불가
- 일부 플랫폼은 robots.txt로 크롤링 제한 가능

### AI 모델 제약
- Gemini API 할당량 초과 시 서비스 일시 중단
- 한국어 이외 언어 블로그는 분석 품질 저하 가능

### 요청 제한
- 시간당 20회 제한으로 대량 분석 불가
- 필요시 `ipRateLimiter.ts`에서 제한 완화

## 디버깅 팁

### RSS URL 추출 문제
1. 브라우저에서 블로그 URL의 HTML 소스 확인
2. `<link rel="alternate" type="application/rss+xml">` 태그 존재 확인
3. `getRssFromUrl.test.ts`에 테스트 케이스 추가

### AI 분석 결과 이상
1. `common-prompt.ts`의 프롬프트 검토
2. JSON 스키마 제약 조건 확인 (`schema.ts`)
3. Gemini API 응답 원본 로그 확인

### 데이터베이스 문제
```bash
# D1 데이터베이스 직접 쿼리
wrangler d1 execute BLOG_ANALYZER_DB --command="SELECT * FROM blog_rss LIMIT 10"
```

## 참고 자료

### 프로덕션 URL
- https://blog-analyzer.pages.dev

### 테스트 예시
- [티스토리 테스트](https://blog-analyzer.pages.dev/report?blog-url=https://jojoldu.tistory.com/)
- [Brunch 테스트](https://blog-analyzer.pages.dev/report?blog-url=https://brunch.co.kr/@jiwoowriter)
- [네이버 블로그 테스트](https://blog-analyzer.pages.dev/report?blog-url=https://blog.naver.com/yiso3147)

### 외부 문서
- [Hono 공식 문서](https://hono.dev/)
- [Google Gemini API 문서](https://ai.google.dev/docs)
- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
