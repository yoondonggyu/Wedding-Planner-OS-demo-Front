import React from 'react'
import './BoardCtaSection.css'

export default function BoardCtaSection() {
  return (
    <section className="section" id="board">
      <div className="container card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          <h2>게시판 베타 미리보기</h2>
          <span className="hint">현재 Vue 마이그레이션 진행 중 · 기존 HTML 버전을 참고하세요</span>
        </div>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          JWT 로그인, AI 태깅, 감성 요약, SQLAdmin과 연동된 실제 데이터 파이프라인을 그대로 가져옵니다.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <a className="btn primary" href="/board.html" target="_blank" rel="noopener noreferrer">기존 게시판 열기</a>
          <button className="btn" type="button">Vue 버전 준비 중</button>
        </div>
      </div>
    </section>
  )
}

