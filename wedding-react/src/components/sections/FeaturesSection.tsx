import React, { useState } from 'react'
import './FeaturesSection.css'

interface Feature {
  title: string
  description: string
  chips: string[]
  details: string[]
}

const features: Feature[] = [
  {
    title: '게시판 · 커뮤니티',
    description: '예비부부/플래너 후기, 견적 비교, 자동 태그, 감성 분석을 한 화면에서 확인',
    chips: ['AI 태깅', 'JWT 인증', '실시간 요약'],
    details: [
      'AI가 악성 댓글/광고를 필터링하고, 감성 점수로 분위기 파악',
      '견적 캡처 업로드 시 OCR → 자동 태그 → 추천 해시태그 생성',
      'JWT 기반 세션으로 모바일/웹 어디서든 동일 로그인 상태 유지',
    ],
  },
  {
    title: 'AI 챗봇 & 큐레이터',
    description: '견적서를 업로드하면 OCR로 추출 후 GPT로 교정, 챗봇이 리스크와 대안 제안',
    chips: ['Vision', 'LLM', '지식 그래프'],
    details: [
      '견적·계약서 PDF 업로드 즉시 주요 조건을 추출하고 위험 조항 표시',
      'LLM이 사용자의 결혼식 컨셉/예산을 학습해 맞춤 일정과 TODO 제안',
      '웨딩 업체 데이터베이스와 연결된 RAG로 근거 중심 답변 제공',
    ],
  },
  {
    title: '캘린더 & 체크리스트',
    description: '웨딩 D-180 템플릿, 일정 알람, 음성 메모, 진행률 리포트',
    chips: ['구글 캘린더', '푸시 알림', 'Progress'],
    details: [
      '웨딩 D-Day를 기준으로 자동 타임라인·Todo 배치 및 진행률 계산',
      '신랑/신부/공동 일정 색상 구분 + 모바일 푸시 알림 연동',
      '음성 메모를 텍스트로 변환해 일정 메모로 자동 저장',
    ],
  },
  {
    title: '예산 · 결제 추적',
    description: '항목별 예상 vs 실제 지출을 자동 비교하고, 평균 단가 대비 과다 항목을 경고',
    chips: ['CSV 업로드', '시각화', '과소비 경보'],
    details: [
      '영수증/견적서 OCR → 항목 자동 분류 → 통합 예산표 업데이트',
      '카테고리별 평균 단가와 비교하여 과소·과대 소비 구간 시각화',
      '환불 일정/중도금 등을 캘린더와 연동해 리마인드',
    ],
  },
]

export default function FeaturesSection() {
  const [showModal, setShowModal] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  const openDetail = (feature: Feature) => {
    setSelectedFeature(feature)
    setShowModal(true)
  }

  const closeDetail = () => {
    setShowModal(false)
    setSelectedFeature(null)
  }

  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-title">
          <h2>핵심 기능 한눈에</h2>
          <span className="hint">웨딩 준비의 모든 페인포인트를 AI로 해결</span>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="feature-card"
              onClick={() => openDetail(feature)}
            >
              <div className="title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{feature.title}</strong>
                <span className="badge">AI</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>{feature.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {feature.chips.map((chip) => (
                  <span
                    key={chip}
                    className="chip"
                    style={{
                      fontSize: 12,
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {showModal && selectedFeature && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-label">기능 상세</p>
                <h3>{selectedFeature.title}</h3>
              </div>
              <button className="icon-btn" type="button" onClick={closeDetail} aria-label="닫기">
                ✕
              </button>
            </div>
            <p className="modal-description">{selectedFeature.description}</p>
            <ul className="detail-list">
              {selectedFeature.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
            <div className="chip-row">
              {selectedFeature.chips.map((chip) => (
                <span key={chip} className="chip tag">
                  {chip}
                </span>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn" type="button" onClick={closeDetail}>닫기</button>
              <button className="btn primary" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                상단으로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

