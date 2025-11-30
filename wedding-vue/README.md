# Wedding OS - Vue.js Frontend

Vue.js 3 + TypeScript + Vite를 사용한 Wedding OS 프론트엔드 프로젝트입니다.

## 🚀 빠른 시작

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 미리보기
pnpm preview
```

## 📦 기술 스택

- **Vue.js 3.5.24**: 프론트엔드 프레임워크
- **TypeScript 5.9.3**: 타입 안정성
- **Vite 7.2.4**: 빌드 도구
- **Pinia 3.0.4**: 상태 관리
- **Vue Router 4.6.3**: 라우팅

## ⚙️ 환경 변수

### 개발 환경 (`.env.development`)

```env
VITE_API_BASE_URL=http://localhost:8101/api
```

### 프로덕션 환경 (`.env.production`)

```env
VITE_API_BASE_URL=https://your-api-server.com/api
```

⚠️ **주의**: `.env` 파일은 Git에 커밋되지 않습니다. `.env.development.sample`과 `.env.production.sample`을 참고하세요.

## 📁 프로젝트 구조

```
src/
├── views/              # 페이지 컴포넌트
│   ├── HomeView.vue
│   ├── BoardView.vue
│   ├── CalendarView.vue
│   ├── BudgetView.vue
│   ├── ChatView.vue
│   ├── VoiceView.vue
│   └── VendorView.vue
├── components/         # 재사용 컴포넌트
│   ├── layout/        # 레이아웃
│   ├── sections/      # 섹션
│   └── modals/        # 모달
├── services/          # API 클라이언트
├── stores/           # Pinia 스토어
├── router/           # 라우터 설정
├── composables/      # Composable 함수
└── config/           # 설정 파일
```

## 🎨 주요 기능

- ✅ 다크/라이트 테마 지원
- ✅ JWT 토큰 기반 인증
- ✅ 반응형 디자인
- ✅ 사이드바 접기/펼치기
- ✅ Toast 알림 시스템
- ✅ 모달 기반 UI

## 📝 개발 가이드

자세한 내용은 상위 디렉토리의 `README.md`를 참조하세요.
