import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './HeroSection.css'

const heroTiles = [
  {
    badge: '🧾 견적 덤탱이 방지',
    title: 'Verbal Cost Auditor',
    description: '견적서 소리 내어 읽거나 사진 찍으면 과다 항목 탐지',
  },
  {
    badge: '🎤 24/7 음성 비서',
    title: 'Voice Personal Assistant',
    description: '운전 중에도 음성 메시지로 일정·예산·제휴 업체 질문 대응',
  },
  {
    badge: '💭 감정 분석 코칭',
    title: 'Emotional Planner',
    description: '음성 대화로 스트레스 수준 파악, 갈등 유형 진단 + 코칭',
  },
]

export default function HeroSection() {
  const navigate = useNavigate()
  const location = useLocation()

  const scrollToSection = (anchor: string) => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const target = document.querySelector(anchor)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } else {
      const target = document.querySelector(anchor)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const scrollToDemo = () => {
    scrollToSection('#demo')
  }

  const scrollToFeatures = () => {
    scrollToSection('#features')
  }

  return (
    <section className="hero">
      <div className="glow" aria-hidden="true"></div>
      <div className="container hero-grid">
        <div>
          <span className="tag">
            🎤 Vision + Voice + LLM • 덤탱이 방지 • 24/7 AI 비서
          </span>
          <h1>
            AI가 예비 부부의
            <span
              style={{
                background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              감정·예산·스타일
            </span>
            을 이해하고 웨딩 전 과정을 자동 조율
          </h1>
          <p className="lead" style={{ color: 'var(--muted)' }}>
            운전 중에도 음성으로 질문하고, 견적서 덤탱이 자동 탐지, 감정 분석 기반 심리 코칭까지. <strong>Vision·Voice·LLM</strong>이 통합된 차세대 웨딩 플래닝 OS.
          </p>
          <div className="cta" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn primary" onClick={scrollToDemo}>빠른 데모 보기 ▶</button>
            <button className="btn" onClick={scrollToFeatures}>핵심 AI 기능 5가지 보기</button>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div className="kpi">
              <span className="dot"></span>
              <small>한국 웨딩 시장 연 4조원 규모</small>
            </div>
            <div className="kpi">
              <span className="dot" style={{ background: 'var(--warn)' }}></span>
              <small>평균 예산 초과율 23% 해결</small>
            </div>
          </div>
        </div>

        <div>
          <div className="hero-card">
            <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
              {heroTiles.map((tile) => (
                <div key={tile.title} className="col" style={{ flex: '1 1 250px' }}>
                  <small style={{ color: 'var(--muted)' }}>{tile.badge}</small>
                  <div style={{ fontWeight: 700, marginTop: 6 }}>{tile.title}</div>
                  <p className="lead" style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {tile.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="card" style={{ marginTop: 12 }}>
              <div className="title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📅 핵심 일정</span>
                <span className="badge">실시간 동기화</span>
              </div>
              <ul style={{ margin: '12px 0 0', paddingLeft: 20, color: 'var(--muted)' }}>
                <li>이번 주 웨딩홀 계약금 결제 및 드레스 피팅</li>
                <li>하객 명단 자동 정리 + 챗봇 Q&A</li>
                <li>예산 초과 항목 AI 경보 & 대안 추천</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

