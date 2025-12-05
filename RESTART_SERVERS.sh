#!/bin/bash

# Wedding OS 전체 서버 재시작 스크립트

echo "🔄 Wedding OS 서버 재시작 중..."

# 1. 프론트엔드 서버 재시작
echo ""
echo "📱 1. 프론트엔드 서버 재시작..."
cd 1.Wedding_OS_front/wedding-vue
echo "   현재 디렉토리: $(pwd)"

# 기존 프로세스 종료 (포트 5173)
echo "   기존 프론트엔드 서버 종료 중..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "   실행 중인 프론트엔드 서버가 없습니다."

# 프론트엔드 서버 시작
echo "   프론트엔드 서버 시작 중..."
pnpm dev &
FRONTEND_PID=$!
echo "   프론트엔드 서버 PID: $FRONTEND_PID"
cd ../..

# 2. 백엔드 서버 재시작
echo ""
echo "🔧 2. 백엔드 서버 재시작..."
cd 2.Wedding_OS_back
echo "   현재 디렉토리: $(pwd)"

# 기존 프로세스 종료 (포트 8101)
echo "   기존 백엔드 서버 종료 중..."
lsof -ti:8101 | xargs kill -9 2>/dev/null || echo "   실행 중인 백엔드 서버가 없습니다."

# 백엔드 서버 시작
echo "   백엔드 서버 시작 중..."
uvicorn app.main:app --host 0.0.0.0 --port 8101 --reload &
BACKEND_PID=$!
echo "   백엔드 서버 PID: $BACKEND_PID"
cd ..

# 3. 모델 서버 재시작
echo ""
echo "🤖 3. 모델 서버 재시작..."
cd 3.Wedding_OS_model
echo "   현재 디렉토리: $(pwd)"

# 기존 프로세스 종료 (포트 8102)
echo "   기존 모델 서버 종료 중..."
lsof -ti:8102 | xargs kill -9 2>/dev/null || echo "   실행 중인 모델 서버가 없습니다."

# 모델 서버 시작
echo "   모델 서버 시작 중..."
uvicorn app.main:app --host 0.0.0.0 --port 8102 --reload &
MODEL_PID=$!
echo "   모델 서버 PID: $MODEL_PID"
cd ..

echo ""
echo "✅ 모든 서버 재시작 완료!"
echo ""
echo "📊 서버 상태:"
echo "   - 프론트엔드: http://localhost:5173 (PID: $FRONTEND_PID)"
echo "   - 백엔드: http://localhost:8101 (PID: $BACKEND_PID)"
echo "   - 모델 서버: http://localhost:8102 (PID: $MODEL_PID)"
echo ""
echo "⚠️  서버를 종료하려면: kill $FRONTEND_PID $BACKEND_PID $MODEL_PID"

