<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const authStore = useAuthStore()

const currentSlide = ref(0)
const totalSlides = 4
const touchStartX = ref(0)
const touchEndX = ref(0)
const isTransitioning = ref(false)

// 다음 슬라이드로 이동
const nextSlide = () => {
  if (isTransitioning.value) return
  if (currentSlide.value < totalSlides - 1) {
    isTransitioning.value = true
    currentSlide.value++
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }
}

// 이전 슬라이드로 이동
const prevSlide = () => {
  if (isTransitioning.value) return
  if (currentSlide.value > 0) {
    isTransitioning.value = true
    currentSlide.value--
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }
}

// 특정 슬라이드로 이동
const goToSlide = (index: number) => {
  if (isTransitioning.value) return
  isTransitioning.value = true
  currentSlide.value = index
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

// 터치 이벤트 처리
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchMove = (e: TouchEvent) => {
  touchEndX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
  if (!touchStartX.value || !touchEndX.value) return
  
  const diff = touchStartX.value - touchEndX.value
  const minSwipeDistance = 50

  if (Math.abs(diff) > minSwipeDistance) {
    if (diff > 0) {
      // 왼쪽으로 스와이프 (다음)
      nextSlide()
    } else {
      // 오른쪽으로 스와이프 (이전)
      prevSlide()
    }
  }
  
  touchStartX.value = 0
  touchEndX.value = 0
}

// 카카오 로그인 (데모용 - 바로 캘린더로 이동)
const handleKakaoLogin = async () => {
  try {
    // 백엔드 서버가 없으므로 바로 로그인 처리
    const demoUser = {
      id: 1,
      email: 'demo@promisemarry.com',
      nickname: '데모 사용자',
      role: 'USER',
      gender: 'BRIDE',
      profileImageUrl: null,
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('wedding_user', JSON.stringify(demoUser))
    localStorage.setItem('wedding_access_token', 'demo_token_' + Date.now())
    localStorage.setItem('wedding_refresh_token', 'demo_refresh_token_' + Date.now())
    
    // 스토어 업데이트
    authStore.hydrate()
    
    // 랜딩 페이지 표시 플래그 저장
    localStorage.setItem('has_seen_landing', 'true')
    
    // 랜딩 페이지 닫기
    emit('close')
    
    // 캘린더 페이지로 이동
    await router.push('/')
  } catch (error) {
    console.error('로그인 처리 중 오류:', error)
  }
}

// 구글 로그인 (데모용 - 바로 캘린더로 이동)
const handleGoogleLogin = async () => {
  // 카카오와 동일하게 처리
  await handleKakaoLogin()
}

onMounted(() => {
  // 이미 로그인되어 있으면 랜딩 페이지 스킵
  if (authStore.isAuthenticated) {
    emit('close')
    router.push('/')
  }
})

// 키보드 이벤트 (화살표 키로 네비게이션)
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    nextSlide()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    prevSlide()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div 
    class="landing-page"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div class="slides-container" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
      <!-- 슬라이드 1: 로고 및 메인 타이틀 -->
      <div class="slide slide-1">
        <div class="logo-container">
          <div class="logo">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="diamond"></div>
          </div>
          <div class="logo-text">
            <div class="logo-label">✔ PromiseMarry Lab</div>
            <div class="logo-name">Promise Marry</div>
          </div>
        </div>
        <div class="hero-content">
          <span class="tag">🎤 Vision + Voice + LLM • 덤탱이 방지 • 24/7 AI 비서</span>
          <h1>
            AI가 예비 부부의
            <span class="gradient-text">감정·예산·스타일</span>
            을 이해하고 웨딩 전 과정을 자동 조율
          </h1>
          <p class="lead">
            운전 중에도 음성으로 질문하고, 견적서 덤탱이 자동 탐지, 감정 분석 기반 심리 코칭까지.
          </p>
        </div>
        <button v-if="currentSlide < totalSlides - 1" class="next-btn" @click="nextSlide">
          →
        </button>
      </div>

      <!-- 슬라이드 2: 앱 설명 및 주요 기능 소개 -->
      <div class="slide slide-2">
        <div class="content-section">
          <h2>웨딩 업계 비용 문제 및 요즘 맞벌이 부부의 부족한 시간을 해소해주는 내 손안의 웨딩 플래너</h2>
          <div class="features-preview">
            <div class="feature-item">
              <span class="feature-icon">🧾</span>
              <div>
                <strong>Verbal Cost Auditor</strong>
                <p>견적서 소리 내어 읽거나 사진 찍으면 과다 항목 탐지</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎤</span>
              <div>
                <strong>Voice Personal Assistant</strong>
                <p>운전 중에도 음성 메시지로 일정·예산·제휴 업체 질문 대응</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💭</span>
              <div>
                <strong>Emotional Planner</strong>
                <p>음성 대화로 스트레스 수준 파악, 갈등 유형 진단 + 코칭</p>
              </div>
            </div>
          </div>
        </div>
        <button v-if="currentSlide < totalSlides - 1" class="next-btn" @click="nextSlide">
          →
        </button>
      </div>

      <!-- 슬라이드 3: 주요 기능 상세 -->
      <div class="slide slide-3">
        <div class="features-content">
          <h2>주요 기능</h2>
          <ul class="features-list">
            <li>
              <strong>게시판 · 커뮤니티</strong>
              <span>예비부부/플래너 후기, 견적 비교, 자동 태그, 감성 분석</span>
            </li>
            <li>
              <strong>AI 챗봇 & 큐레이터</strong>
              <span>견적서 OCR 추출, GPT 교정, 리스크와 대안 제안</span>
            </li>
            <li>
              <strong>캘린더 & 체크리스트</strong>
              <span>웨딩 D-180 템플릿, 일정 알람, 음성 메모, 진행률 리포트</span>
            </li>
            <li>
              <strong>예산 · 결제 추적</strong>
              <span>항목별 예상 vs 실제 지출 비교, 평균 단가 대비 과다 항목 경고</span>
            </li>
            <li>
              <strong>업체 추천</strong>
              <span>제휴 업체 및 인기 업체 카테고리별 추천</span>
            </li>
          </ul>
        </div>
        <button v-if="currentSlide < totalSlides - 1" class="next-btn" @click="nextSlide">
          →
        </button>
      </div>

      <!-- 슬라이드 4: 시작하기 -->
      <div class="slide slide-4">
        <div class="start-content">
          <h2>시작하기</h2>
          <p class="start-description">지금 바로 시작하여 웨딩 준비를 더욱 쉽고 편리하게 만들어보세요</p>
          <div class="login-buttons">
            <button class="login-btn kakao-btn" @click="handleKakaoLogin">
              <span class="login-icon">💬</span>
              <span>카카오 로그인</span>
            </button>
            <button class="login-btn google-btn" @click="handleGoogleLogin">
              <span class="login-icon">G</span>
              <span>Sign in with Google</span>
            </button>
          </div>
          <div class="kpi-section">
            <div class="kpi">
              <span class="dot"></span>
              <small>한국 웨딩 시장 연 4조원 규모</small>
            </div>
            <div class="kpi">
              <span class="dot" style="background: var(--warn)"></span>
              <small>평균 예산 초과율 23% 해결</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 인디케이터 -->
    <div class="indicators">
      <button
        v-for="(slide, index) in totalSlides"
        :key="index"
        class="indicator"
        :class="{ active: currentSlide === index }"
        @click="goToSlide(index)"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.landing-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: #000;
  z-index: 10000;
}

.slides-container {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.slide {
  min-width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow-y: auto;
}

/* 슬라이드 1: 로고 및 메인 타이틀 */
.slide-1 {
  background: linear-gradient(to bottom, rgba(255, 192, 203, 0.1), #fff);
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
}

.logo {
  position: relative;
  width: 120px;
  height: 120px;
}

.ring {
  position: absolute;
  border: 4px solid;
  border-radius: 50%;
  width: 100%;
  height: 100%;
}

.ring-1 {
  border-color: #FFD700;
  top: 0;
  left: 0;
}

.ring-2 {
  border-color: #FFB6C1;
  top: 10px;
  left: 10px;
  width: calc(100% - 20px);
  height: calc(100% - 20px);
}

.diamond {
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: #FFD700;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.logo-text {
  text-align: center;
}

.logo-label {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #FFD700, #FFB6C1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.logo-name {
  font-size: 24px;
  font-weight: 700;
  color: #000;
}

.hero-content {
  text-align: center;
  max-width: 90%;
}

.tag {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 20px;
  font-size: 14px;
  color: var(--accent);
  margin-bottom: 20px;
}

.hero-content h1 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 16px;
  color: #000;
}

.gradient-text {
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 16px;
  line-height: 1.6;
  color: #666;
  margin-bottom: 20px;
}

/* 슬라이드 2: 앱 설명 */
.slide-2 {
  background: #f5f5f5;
}

.content-section {
  max-width: 90%;
  text-align: center;
}

.content-section h2 {
  font-size: 22px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 40px;
}

.features-preview {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 30px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-align: left;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.feature-item strong {
  display: block;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #333;
}

.feature-item p {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* 슬라이드 3: 주요 기능 */
.slide-3 {
  background: #f5f5f5;
}

.features-content {
  max-width: 90%;
  text-align: left;
}

.features-content h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 30px;
  color: #333;
  text-align: center;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.features-list li {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.features-list li strong {
  font-size: 18px;
  color: #333;
}

.features-list li span {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 슬라이드 4: 시작하기 */
.slide-4 {
  background: #f5f5f5;
}

.start-content {
  max-width: 90%;
  text-align: center;
}

.start-content h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #333;
}

.start-description {
  font-size: 16px;
  color: #666;
  margin-bottom: 40px;
  line-height: 1.6;
}

.login-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 300px;
  margin: 0 auto 30px;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.kakao-btn {
  background: #FEE500;
  color: #000;
}

.kakao-btn:hover {
  background: #FDD835;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(253, 216, 53, 0.3);
}

.google-btn {
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
}

.google-btn:hover {
  background: #f9f9f9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-icon {
  font-size: 20px;
  font-weight: 700;
}

.kpi-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 30px;
}

.kpi {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
}

.next-btn {
  position: absolute;
  bottom: 40px;
  right: 20px;
  background: #000;
  color: #fff;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.next-btn:hover {
  background: #333;
  transform: scale(1.1);
}

/* 인디케이터 */
.indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10001;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.indicator.active {
  background: #fff;
  width: 24px;
  border-radius: 4px;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .slide {
    padding: 20px;
  }

  .logo {
    width: 100px;
    height: 100px;
  }

  .hero-content h1 {
    font-size: 22px;
  }

  .content-section h2 {
    font-size: 18px;
  }

  .features-content h2,
  .start-content h2 {
    font-size: 20px;
  }

  .next-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
    bottom: 20px;
    right: 16px;
  }

  .feature-item {
    padding: 16px;
  }

  .features-list li {
    padding: 16px;
  }
}
</style>
