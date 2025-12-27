import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/contexts/auth'
import SocialLoginModal from '@/components/modals/SocialLoginModal'
import './LandingPage.css'

interface LandingPageProps {
  onClose: () => void
}

export default function LandingPage({ onClose }: LandingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = 4
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showSocialLoginModal, setShowSocialLoginModal] = useState(false)

  const navigate = useNavigate()
  const authStore = useAuthStore()

  const nextSlide = useCallback(() => {
    if (isTransitioning) return
    if (currentSlide < totalSlides - 1) {
      setIsTransitioning(true)
      setCurrentSlide((prev) => prev + 1)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }
  }, [currentSlide, isTransitioning, totalSlides])

  const prevSlide = useCallback(() => {
    if (isTransitioning) return
    if (currentSlide > 0) {
      setIsTransitioning(true)
      setCurrentSlide((prev) => prev - 1)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }
  }, [currentSlide, isTransitioning])

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide(index)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }, [isTransitioning])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return
    
    const diff = touchStartX - touchEndX
    const minSwipeDistance = 50

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }
    
    setTouchStartX(0)
    setTouchEndX(0)
  }

  const handleKakaoLogin = async () => {
    setShowSocialLoginModal(false)
    // TODO: 실제 카카오 로그인 API 연동
    // 임시: 바로 넘어가기
    onClose()
    navigate('/')
  }

  const handleGoogleLogin = async () => {
    setShowSocialLoginModal(false)
    // 소셜 로그인 후 회원가입/로그인 플로우로 이동
    authStore.openLoginModal()
    // TODO: 실제 구글 로그인 API 연동
  }

  const handleStartLogin = () => {
    // 3페이지를 넘긴 후 로그인 버튼 클릭 시 소셜 로그인 모달 표시
    setShowSocialLoginModal(true)
  }

  useEffect(() => {
    if (authStore.isAuthenticated) {
      onClose()
      navigate('/')
    }
  }, [authStore.isAuthenticated, navigate, onClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextSlide()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      prevSlide()
    }
  }, [nextSlide, prevSlide])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div
      className="landing-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="slides-container" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {/* 슬라이드 1: 로고 및 메인 타이틀 */}
        <div className="slide slide-1">
          <div className="logo-container">
            <div className="logo">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="diamond"></div>
            </div>
            <div className="logo-text">
              <div className="logo-label">✔ PromiseMarry Lab</div>
              <div className="logo-name">Promise Marry</div>
            </div>
          </div>
          <div className="hero-content">
            <span className="tag">🎤 Vision + Voice + LLM • 덤탱이 방지 • 24/7 AI 비서</span>
            <h1>
              AI가 예비 부부의
              <span className="gradient-text"> 감정·예산·스타일</span>
              을 이해하고 웨딩 전 과정을 자동 조율
            </h1>
            <p className="lead">
              운전 중에도 음성으로 질문하고, 견적서 덤탱이 자동 탐지, 감정 분석 기반 심리 코칭까지.
            </p>
          </div>
          {currentSlide < totalSlides - 1 && (
            <button className="next-btn" onClick={nextSlide}>
              →
            </button>
          )}
        </div>

        {/* 슬라이드 2: 앱 설명 및 주요 기능 소개 */}
        <div className="slide slide-2">
          <div className="content-section">
            <h2>웨딩 업계 비용 문제 및 요즘 맞벌이 부부의 부족한 시간을 해소해주는 내 손안의 웨딩 플래너</h2>
            <div className="features-preview">
              <div className="feature-item">
                <span className="feature-icon">🧾</span>
                <div>
                  <strong>Verbal Cost Auditor</strong>
                  <p>견적서 소리 내어 읽거나 사진 찍으면 과다 항목 탐지</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎤</span>
                <div>
                  <strong>Voice Personal Assistant</strong>
                  <p>운전 중에도 음성 메시지로 일정·예산·제휴 업체 질문 대응</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💭</span>
                <div>
                  <strong>Emotional Planner</strong>
                  <p>음성 대화로 스트레스 수준 파악, 갈등 유형 진단 + 코칭</p>
                </div>
              </div>
            </div>
          </div>
          {currentSlide < totalSlides - 1 && (
            <button className="next-btn" onClick={nextSlide}>
              →
            </button>
          )}
        </div>

        {/* 슬라이드 3: 주요 기능 상세 */}
        <div className="slide slide-3">
          <div className="features-content">
            <h2>주요 기능</h2>
            <ul className="features-list">
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
          {currentSlide < totalSlides - 1 && (
            <button className="next-btn" onClick={nextSlide}>
              →
            </button>
          )}
        </div>

        {/* 슬라이드 4: 시작하기 */}
        <div className="slide slide-4">
          <div className="start-content">
            <h2>시작하기</h2>
            <p className="start-description">지금 바로 시작하여 웨딩 준비를 더욱 쉽고 편리하게 만들어보세요</p>
            {currentSlide >= 3 && (
              <>
                <div className="login-buttons">
                  <button className="login-btn kakao-btn" onClick={handleStartLogin}>
                    <span className="login-icon">💬</span>
                    <span>카카오 로그인</span>
                  </button>
                  <button className="login-btn google-btn" onClick={handleStartLogin}>
                    <span className="login-icon">G</span>
                    <span>Sign in with Google</span>
                  </button>
                </div>
                <div className="kpi-section">
                  <div className="kpi">
                    <span className="dot"></span>
                    <small>한국 웨딩 시장 연 4조원 규모</small>
                  </div>
                  <div className="kpi">
                    <span className="dot" style={{ background: 'var(--warn)' }}></span>
                    <small>평균 예산 초과율 23% 해결</small>
                  </div>
                </div>
              </>
            )}
          </div>
          {currentSlide < totalSlides - 1 && (
            <button className="next-btn" onClick={nextSlide}>
              →
            </button>
          )}
        </div>
      </div>

      {/* 인디케이터 */}
      <div className="indicators">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            className={`indicator ${currentSlide === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      {/* 소셜 로그인 모달 */}
      <SocialLoginModal
        isOpen={showSocialLoginModal}
        onClose={() => setShowSocialLoginModal(false)}
        onKakaoLogin={handleKakaoLogin}
        onGoogleLogin={handleGoogleLogin}
      />
    </div>
  )
}

