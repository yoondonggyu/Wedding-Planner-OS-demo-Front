# Wedding OS Frontend (Vue.js)

Wedding OS 프로젝트의 Vue.js 기반 프론트엔드 애플리케이션입니다.

## 기술 스택

- **Vue 3** (Composition API with `<script setup>`)
- **TypeScript**
- **Vite** (빌드 도구)
- **Vue Router** (SPA 라우팅)
- **Pinia** (상태 관리)
- **pnpm** (패키지 매니저)

## 프로젝트 구조

```
wedding-vue/
├── src/
│   ├── assets/          # 정적 리소스 (스타일, 이미지)
│   ├── components/      # Vue 컴포넌트
│   │   ├── layout/     # 레이아웃 컴포넌트 (Sidebar, HeaderBar)
│   │   ├── modals/     # 모달 컴포넌트 (LoginModal)
│   │   └── sections/   # 섹션 컴포넌트 (BoardSection 등)
│   ├── views/          # 페이지 뷰 컴포넌트
│   ├── stores/         # Pinia 스토어 (auth.ts)
│   ├── services/       # API 서비스 (apiClient.ts, authService.ts)
│   ├── composables/    # Vue 컴포저블 (useApi.ts)
│   ├── types/          # TypeScript 타입 정의
│   ├── config/         # 설정 파일 (env.ts)
│   ├── router/         # Vue Router 설정
│   └── main.ts         # 애플리케이션 진입점
├── env.development.sample  # 개발 환경 변수 샘플
├── env.production.sample   # 프로덕션 환경 변수 샘플
└── package.json
```

## 설치 및 실행

### 1. 패키지 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.development` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_API_BASE_URL=http://localhost:8101/api
```

프로덕션 환경의 경우 `.env.production` 파일을 생성하고 실제 서버 URL을 입력하세요:

```env
VITE_API_BASE_URL=https://your-production-api.com/api
```

> **참고**: 샘플 파일(`env.development.sample`, `env.production.sample`)을 복사하여 사용할 수 있습니다.

### 3. 개발 서버 실행

```bash
pnpm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 4. 프로덕션 빌드

```bash
pnpm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 5. 프로덕션 미리보기

```bash
pnpm run preview
```

## 환경 변수 가이드

### 필수 환경 변수

- `VITE_API_BASE_URL`: 백엔드 API 기본 URL
  - 개발: `http://localhost:8101/api`
  - 프로덕션: 실제 배포 서버 URL

### 환경 변수 사용법

코드에서 환경 변수는 `import.meta.env.VITE_*` 형태로 접근합니다:

```typescript
import { API_BASE_URL } from '@/config/env'

// API_BASE_URL은 import.meta.env.VITE_API_BASE_URL을 사용합니다
```

### 환경별 설정

- **개발 환경**: `.env.development` 파일 사용
- **프로덕션 환경**: `.env.production` 파일 사용
- **로컬 테스트**: `.env.local` 파일 사용 (git에 커밋하지 않음)

> **주의**: `.env` 파일은 민감한 정보를 포함할 수 있으므로 Git에 커밋하지 마세요. `.gitignore`에 이미 포함되어 있습니다.

## 주요 기능

### 인증 (Authentication)

- JWT 토큰 기반 인증
- 로그인/로그아웃
- 토큰 자동 갱신 (Refresh Token)
- 로그인 상태 유지 (localStorage)

### 게시판 (Board)

- 게시글 목록 조회
- 게시글 상세 보기
- 게시글 작성/수정/삭제
- 이미지 업로드
- 댓글 작성/수정/삭제
- 좋아요 기능
- 조회수 증가

### 캘린더 (Calendar)

- 일정 관리
- 할일(Todo) 리스트
- 예식일 설정 및 D-Day 계산
- 타임라인 자동 생성

### 예산 (Budget)

- 예산 항목 관리
- Excel/CSV 내보내기
- 파일 업로드
- 영수증 OCR 처리

### AI 플래너 (Chat)

- 스트리밍 채팅 인터페이스
- 개인 데이터 기반 맞춤 조언
- 감정 분석

### 음성 비서 (Voice)

- 음성 녹음 및 STT
- 텍스트 입력 지원
- 자동 정리 기능
- 음성 명령 처리

## API 통신

모든 API 호출은 `useApi` 컴포저블을 통해 이루어집니다:

```typescript
import { useApi } from '@/composables/useApi'

const { request } = useApi()

// GET 요청
const data = await request('/posts', { method: 'GET' })

// POST 요청
await request('/posts', {
  method: 'POST',
  body: { title: '제목', content: '내용' },
})
```

`useApi`는 자동으로:
- JWT 토큰을 헤더에 추가
- 401 에러 시 Refresh Token으로 자동 갱신 시도
- 에러 처리

## 상태 관리

Pinia를 사용한 전역 상태 관리:

- `auth` 스토어: 인증 상태, 사용자 정보, 토큰 관리

```typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
```

## 라우팅

Vue Router를 사용한 SPA 라우팅:

- `/` - 홈 (랜딩 페이지)
- `/board` - 게시판
- `/calendar` - 캘린더
- `/budget` - 예산서
- `/chat` - AI 플래너
- `/voice` - 음성 비서

## 테마

다크/라이트 테마를 지원합니다. 헤더바의 테마 토글 버튼으로 전환할 수 있습니다.

## 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 문제 해결

### API 연결 오류

1. `.env.development` 파일이 올바르게 설정되었는지 확인
2. 백엔드 서버가 실행 중인지 확인
3. CORS 설정이 올바른지 확인

### 빌드 오류

1. `pnpm install`로 의존성 재설치
2. `node_modules` 삭제 후 재설치
3. TypeScript 타입 오류 확인

## 라이선스

이 프로젝트는 Wedding OS 프로젝트의 일부입니다.
