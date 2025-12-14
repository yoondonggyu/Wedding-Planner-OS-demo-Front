# 해커톤 설정 가이드 - Invitation Feature Only

해커톤에서 청첩장 기능만 사용하기 위한 설정 가이드입니다.

## 사전 준비

### 1. 브랜치 체크아웃

각 저장소에서 `feature/invitation` 브랜치로 체크아웃:

```bash
# 백엔드
cd 2.Wedding_OS_back
git checkout feature/invitation

# 프론트엔드
cd 1.Wedding_OS_front
git checkout feature/invitation

# 모델 서버
cd 3.Wedding_OS_model
git checkout feature/invitation
```

### 2. 환경 변수 설정

#### 백엔드 (2.Wedding_OS_back/.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=wedding_os

JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

MODEL_API_URL=http://localhost:8502/api
```

#### 프론트엔드 (1.Wedding_OS_front/wedding-vue/.env.development)
```env
VITE_API_BASE_URL=http://localhost:8101/api
VITE_MODEL_API_BASE_URL=http://localhost:8502
```

#### 모델 서버 (3.Wedding_OS_model/.env)
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

HOST=0.0.0.0
PORT=8502
```

## 서버 실행 순서

### 1. 데이터베이스 확인
MySQL이 실행 중인지 확인하고 필요한 테이블이 생성되어 있는지 확인합니다.

### 2. 모델 서버 실행
```bash
cd 3.Wedding_OS_model
uvicorn app.main:app --host 0.0.0.0 --port 8502 --reload
```

### 3. 백엔드 서버 실행
```bash
cd 2.Wedding_OS_back
uvicorn app.main:app --host 0.0.0.0 --port 8101 --reload
```

### 4. 프론트엔드 서버 실행
```bash
cd 1.Wedding_OS_front/wedding-vue
pnpm install  # 처음 한 번만
pnpm dev
```

## 접속 정보

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8101/api
- **모델 서버 API**: http://localhost:8502/api
- **백엔드 API 문서**: http://localhost:8101/docs

## 테스트 계정

테스트 계정 제한이 해제된 경우:
- `boy@naver.com` / `password`
- `girl@naver.com` / `password`

## 활성화된 기능

### 사용 가능
- ✅ 회원가입 / 로그인
- ✅ 청첩장 디자인 생성 (5단계)
- ✅ 디지털 청첩장 생성 및 조회
- ✅ 이미지 다운로드

### 비활성화됨
- ❌ 게시판
- ❌ 캘린더
- ❌ 예산 관리
- ❌ 챗봇
- ❌ 음성 비서
- ❌ 업체 매칭
- ❌ 커플 기능

## 문제 해결

### 포트 충돌
- 백엔드: `lsof -ti:8101 | xargs kill -9`
- 모델 서버: `lsof -ti:8502 | xargs kill -9`
- 프론트엔드: `lsof -ti:5173 | xargs kill -9`

### 데이터베이스 연결 오류
- MySQL이 실행 중인지 확인
- `.env` 파일의 데이터베이스 정보 확인

### API 연결 오류
- 각 서버가 정상 실행 중인지 확인
- CORS 설정 확인 (이미 설정되어 있음)

## 추후 기능 추가

다른 기능을 추가하려면:

1. `main` 브랜치에서 새 기능 브랜치 생성
2. 기능 개발 완료 후 `feature/invitation` 브랜치에 merge
3. `app/main.py` (백엔드/모델) 또는 `router/index.ts` (프론트)에서 주석 해제

## 참고 문서

- 백엔드: `2.Wedding_OS_back/README_INVITATION.md`
- 프론트엔드: `1.Wedding_OS_front/README_INVITATION.md`
- 모델 서버: `3.Wedding_OS_model/README_INVITATION.md`
