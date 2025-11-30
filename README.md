# Wedding OS - Frontend

웨딩 플래너를 위한 종합 관리 시스템의 프론트엔드입니다.

## 📋 프로젝트 개요

Wedding OS 프론트엔드는 예비부부를 위한 웨딩 준비 통합 관리 플랫폼의 사용자 인터페이스입니다. Vue.js 3와 TypeScript를 기반으로 구축되었습니다.

## 🛠 기술 스택

### Vue.js 프로젝트 (wedding-vue/)
- **Framework**: Vue.js 3.5.24
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **State Management**: Pinia 3.0.4
- **Routing**: Vue Router 4.6.3
- **Package Manager**: pnpm

### 레거시 HTML 프로젝트
- 순수 HTML/CSS/JavaScript
- 기존 프로토타입 페이지들

## 📁 프로젝트 구조

```
1.Wedding_OS_front/
├── wedding-vue/              # Vue.js 3 + TypeScript 프로젝트 (메인)
│   ├── src/
│   │   ├── views/            # 페이지 컴포넌트
│   │   │   ├── HomeView.vue
│   │   │   ├── BoardView.vue
│   │   │   ├── CalendarView.vue
│   │   │   ├── BudgetView.vue
│   │   │   ├── ChatView.vue
│   │   │   ├── VoiceView.vue
│   │   │   └── VendorView.vue
│   │   ├── components/       # 재사용 컴포넌트
│   │   │   ├── layout/      # 레이아웃 컴포넌트
│   │   │   ├── sections/    # 섹션 컴포넌트
│   │   │   └── modals/      # 모달 컴포넌트
│   │   ├── services/         # API 클라이언트
│   │   ├── stores/          # Pinia 스토어
│   │   ├── router/          # Vue Router 설정
│   │   └── composables/    # Composable 함수
│   ├── package.json
│   └── vite.config.ts
├── api_reference.html        # API 명세서 (HTML)
├── database_erd_viewer.html  # 데이터베이스 ERD 뷰어
└── *.html                    # 레거시 HTML 페이지들
```

## 🚀 시작하기

### 1. Vue.js 프로젝트 설정

```bash
# wedding-vue 디렉토리로 이동
cd wedding-vue

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install
```

### 2. 환경 변수 설정

`.env.development` 파일 생성:

```env
VITE_API_BASE_URL=http://localhost:8101/api
```

`.env.production` 파일 생성 (프로덕션):

```env
VITE_API_BASE_URL=https://your-api-server.com/api
```

### 3. 개발 서버 실행

```bash
# 개발 모드 (핫 리로드)
pnpm dev

# 빌드
pnpm build

# 프로덕션 미리보기
pnpm preview
```

기본 포트: `http://localhost:5173`

## 🎨 주요 기능

### 1. 홈페이지
- 히어로 섹션
- 기능 소개
- 빠른 데모 섹션
- 사용 흐름 안내

### 2. 게시판
- 예비부부 게시판
- 게시글 작성/수정/삭제
- 댓글 시스템
- 좋아요 기능
- 이미지 업로드
- AI 기능 (요약, 감성 분석)

### 3. 캘린더
- 일정 관리
- 할일 리스트
- 예식일 설정
- 자동 타임라인 생성
- 날짜별 필터링
- 우선순위 및 담당자별 색상 구분

### 4. 예산 관리
- 예산 항목 추가/수정/삭제
- 카테고리별 관리
- OCR 기반 영수증 처리
- Excel 형식 지원

### 5. 챗봇
- LLM 기반 대화
- 사용자 메모리 기반 개인화
- 대화 기록 저장

### 6. 음성 비서
- 음성 명령 입력
- STT (Speech-to-Text)
- 음성 명령 처리

### 7. 업체 매칭
- 웨딩 프로필 생성
- 업체 추천
- 즐겨찾기 관리
- 업체 상세 정보

### 8. 사용자 인증
- 로그인 / 회원가입
- JWT 토큰 기반 인증
- 프로필 수정
- 프로필 이미지 업로드

## 🎯 UI/UX 특징

### 다크/라이트 테마
- 시스템 설정에 따른 자동 테마 전환
- 수동 테마 토글 지원
- 기본 테마: Light 모드

### 반응형 디자인
- 모바일, 태블릿, 데스크톱 지원
- 반응형 레이아웃

### 사이드바
- 접기/펼치기 기능
- 호버 시 메뉴 표시
- 로그인 상태별 메뉴 구분

## 🔗 API 연동

### API 클라이언트

```typescript
// src/services/apiClient.ts
// 모든 API 요청은 JWT 토큰을 자동으로 포함합니다
```

### 환경 변수

```typescript
// src/config/env.ts
// VITE_API_BASE_URL 환경 변수로 API 서버 주소 설정
```

## 📦 빌드 및 배포

### 개발 빌드

```bash
pnpm build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### 프로덕션 배포

1. 환경 변수 설정 (`.env.production`)
2. 빌드 실행 (`pnpm build`)
3. `dist/` 디렉토리를 정적 파일 서버에 배포

## 🗂 레거시 HTML 페이지

프로젝트에는 Vue.js로 마이그레이션되기 전의 HTML 페이지들이 포함되어 있습니다:

- `index.html`: 메인 랜딩 페이지
- `board.html`: 게시판 페이지
- `calendar.html`: 캘린더 페이지
- `budget.html`: 예산 관리 페이지
- `chat.html`: 챗봇 페이지
- `voice.html`: 음성 비서 페이지

이 페이지들은 참고용으로 유지되며, 현재는 Vue.js 프로젝트가 메인입니다.

## 📚 문서

- **API 레퍼런스**: `api_reference.html` - 전체 API 명세서
- **데이터베이스 ERD**: `database_erd_viewer.html` - 데이터베이스 구조 시각화

## 🔧 개발 가이드

### 컴포넌트 구조

```
views/          # 페이지 레벨 컴포넌트
components/     # 재사용 가능한 컴포넌트
  ├── layout/  # 레이아웃 컴포넌트
  ├── sections/# 섹션 컴포넌트
  └── modals/  # 모달 컴포넌트
```

### 상태 관리

Pinia를 사용한 전역 상태 관리:

```typescript
// stores/auth.ts
// 인증 상태 관리
```

### 라우팅

Vue Router를 사용한 SPA 라우팅:

```typescript
// router/index.ts
// 라우트 설정
```

## 🐛 문제 해결

### 포트 충돌

기본 포트(5173)가 사용 중인 경우:

```bash
pnpm dev -- --port 5174
```

### API 연결 오류

`.env.development` 파일의 `VITE_API_BASE_URL`을 확인하세요.

### 빌드 오류

```bash
# node_modules 재설치
rm -rf node_modules
pnpm install
```

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.
