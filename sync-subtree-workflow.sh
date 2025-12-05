#!/bin/bash

# Git Subtree 워크플로우 스크립트
# 각 서비스를 개별 레포지토리에 커밋한 후, Promise-Marry-Lab에 subtree로 반영

set -e

PROJECT_ROOT="/Users/yoon-dong-gyu/kakao_bootcamp/1.Wedding_OS_Project"
cd "$PROJECT_ROOT"

echo "🔄 Git Subtree 워크플로우 시작..."
echo ""

# 1. Frontend를 Wedding-Planner-OS-demo-Front 레포지토리에 푸시
echo "📦 Step 1: Frontend를 개별 레포지토리에 푸시"
cd "$PROJECT_ROOT/Wedding-Planner-OS-demo-Front"

# 원격 저장소 확인
if ! git remote | grep -q "origin"; then
    echo "  → 원격 저장소 추가 중..."
    git remote add origin https://github.com/yoondonggyu/Wedding-Planner-OS-demo-Front.git
fi

# 변경사항 확인
if [ -n "$(git status --porcelain)" ]; then
    echo "  → Frontend 변경사항 커밋 중..."
    git add .
    git commit -m "fix: TypeScript showToast 호출 수정 및 빌드 오류 수정" || echo "  ⚠️  변경사항이 없거나 이미 커밋됨"
    
    echo "  → Frontend 레포지토리에 푸시 중..."
    git push origin main || {
        echo "  ⚠️  푸시 실패. 원격 변경사항을 먼저 가져오세요:"
        echo "     git pull origin main --rebase"
        exit 1
    }
    echo "  ✅ Frontend 푸시 완료"
else
    echo "  ✅ Frontend 변경사항 없음"
fi

cd "$PROJECT_ROOT"

# 2. Backend를 Wedding-Planner-OS-demo-Back 레포지토리에 푸시
echo ""
echo "📦 Step 2: Backend를 개별 레포지토리에 푸시"
cd "$PROJECT_ROOT/Wedding-Planner-OS-demo-Back"

if ! git remote | grep -q "origin"; then
    echo "  → 원격 저장소 추가 중..."
    git remote add origin https://github.com/yoondonggyu/Wedding-Planner-OS-demo-Back.git
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "  → Backend 변경사항 커밋 중..."
    git add .
    git commit -m "chore: 의존성 및 설정 업데이트" || echo "  ⚠️  변경사항이 없거나 이미 커밋됨"
    
    echo "  → Backend 레포지토리에 푸시 중..."
    git push origin main || {
        echo "  ⚠️  푸시 실패. 원격 변경사항을 먼저 가져오세요:"
        echo "     git pull origin main --rebase"
        exit 1
    }
    echo "  ✅ Backend 푸시 완료"
else
    echo "  ✅ Backend 변경사항 없음"
fi

cd "$PROJECT_ROOT"

# 3. Model을 Wedding-Planner-OS-demo-Model 레포지토리에 푸시
echo ""
echo "📦 Step 3: Model을 개별 레포지토리에 푸시"
cd "$PROJECT_ROOT/Wedding-Planner-OS-demo-Model"

if ! git remote | grep -q "origin"; then
    echo "  → 원격 저장소 추가 중..."
    git remote add origin https://github.com/yoondonggyu/Wedding-Planner-OS-demo-Model.git
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "  → Model 변경사항 커밋 중..."
    git add .
    git commit -m "chore: 의존성 및 설정 업데이트" || echo "  ⚠️  변경사항이 없거나 이미 커밋됨"
    
    echo "  → Model 레포지토리에 푸시 중..."
    git push origin main || {
        echo "  ⚠️  푸시 실패. 원격 변경사항을 먼저 가져오세요:"
        echo "     git pull origin main --rebase"
        exit 1
    }
    echo "  ✅ Model 푸시 완료"
else
    echo "  ✅ Model 변경사항 없음"
fi

cd "$PROJECT_ROOT"

# 4. Promise-Marry-Lab 레포지토리에서 subtree로 가져오기
echo ""
echo "📥 Step 4: Promise-Marry-Lab에 subtree로 반영"

# 원격 저장소 확인
if ! git remote | grep -q "origin"; then
    echo "  → 원격 저장소 추가 중..."
    git remote add origin https://github.com/yoondonggyu/Promise-Marry-Lab.git
fi

# 원격 변경사항 가져오기
echo "  → 원격 변경사항 가져오는 중..."
git fetch origin main || true

# Frontend subtree pull
echo "  → Frontend subtree 가져오는 중..."
git subtree pull --prefix=Wedding-Planner-OS-demo-Front \
    https://github.com/yoondonggyu/Wedding-Planner-OS-demo-Front.git main \
    --squash -m "chore: Frontend subtree 업데이트" || {
    echo "  ⚠️  Frontend subtree pull 실패 (처음이면 subtree add 필요)"
}

# Backend subtree pull
echo "  → Backend subtree 가져오는 중..."
git subtree pull --prefix=Wedding-Planner-OS-demo-Back \
    https://github.com/yoondonggyu/Wedding-Planner-OS-demo-Back.git main \
    --squash -m "chore: Backend subtree 업데이트" || {
    echo "  ⚠️  Backend subtree pull 실패 (처음이면 subtree add 필요)"
}

# Model subtree pull
echo "  → Model subtree 가져오는 중..."
git subtree pull --prefix=Wedding-Planner-OS-demo-Model \
    https://github.com/yoondonggyu/Wedding-Planner-OS-demo-Model.git main \
    --squash -m "chore: Model subtree 업데이트" || {
    echo "  ⚠️  Model subtree pull 실패 (처음이면 subtree add 필요)"
}

# GitHub Workflows 커밋
echo ""
echo "📝 Step 5: GitHub Workflows 커밋"
if [ -n "$(git status --porcelain .github/)" ]; then
    git add .github/
    git commit -m "fix: GitHub Actions 워크플로우 YAML 구문 오류 수정" || echo "  ⚠️  변경사항이 없거나 이미 커밋됨"
fi

# Promise-Marry-Lab에 푸시
echo ""
echo "📤 Step 6: Promise-Marry-Lab에 푸시"
git push origin main || {
    echo "  ⚠️  푸시 실패. 원격 변경사항을 먼저 가져오세요:"
    echo "     git pull origin main --rebase"
    exit 1
}

echo ""
echo "✅ 모든 작업 완료!"
echo ""
echo "📋 요약:"
echo "  1. ✅ Frontend → Wedding-Planner-OS-demo-Front 레포지토리"
echo "  2. ✅ Backend → Wedding-Planner-OS-demo-Back 레포지토리"
echo "  3. ✅ Model → Wedding-Planner-OS-demo-Model 레포지토리"
echo "  4. ✅ Promise-Marry-Lab에 subtree로 반영"
echo "  5. ✅ Promise-Marry-Lab에 푸시 완료"

