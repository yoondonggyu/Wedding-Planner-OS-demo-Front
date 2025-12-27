import React, { useState } from 'react'
import clsx from 'clsx'
import './DemoShowcase.css'

type DemoType = 'board' | 'chat' | 'calendar' | 'budget' | 'voice' | 'vendor' | 'vendor-message' | 'invitation' | 'private-space' | 'document-vault' | null

export default function DemoShowcase() {
  const [currentDemo, setCurrentDemo] = useState<DemoType>(null)

  const openDemo = (kind: DemoType) => {
    setCurrentDemo(kind)
  }

  return (
    <section className="section" id="demo">
      <div className="container">
        <div className="section-title">
          <h2>빠른 데모</h2>
          <span className="hint">실제 데이터 연결 전 시나리오 미리보기</span>
        </div>
        <div className="card">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <button className={clsx('btn', { active: currentDemo === 'board' })} type="button" onClick={() => openDemo('board')}>
              📋 게시판
            </button>
            <button className={clsx('btn', { active: currentDemo === 'chat' })} type="button" onClick={() => openDemo('chat')}>
              🤖 챗봇
            </button>
            <button className={clsx('btn', { active: currentDemo === 'calendar' })} type="button" onClick={() => openDemo('calendar')}>
              📅 일정관리
            </button>
            <button className={clsx('btn', { active: currentDemo === 'budget' })} type="button" onClick={() => openDemo('budget')}>
              💰 예산서
            </button>
            <button className={clsx('btn', { active: currentDemo === 'voice' })} type="button" onClick={() => openDemo('voice')}>
              🎤 음성비서
            </button>
            <button className={clsx('btn', { active: currentDemo === 'vendor' })} type="button" onClick={() => openDemo('vendor')}>
              💍 업체추천
            </button>
            <button className={clsx('btn', { active: currentDemo === 'vendor-message' })} type="button" onClick={() => openDemo('vendor-message')}>
              💬 제휴 업체 메시지
            </button>
            <button className={clsx('btn', { active: currentDemo === 'invitation' })} type="button" onClick={() => openDemo('invitation')}>
              💌 청첩장 디자인
            </button>
            <button className={clsx('btn', { active: currentDemo === 'private-space' })} type="button" onClick={() => openDemo('private-space')}>
              💑 우리만의 공간
            </button>
            <button className={clsx('btn', { active: currentDemo === 'document-vault' })} type="button" onClick={() => openDemo('document-vault')}>
              📁 문서 보관함
            </button>
          </div>
          <div id="demo-box" className="demo-box">
            {!currentDemo ? (
              <div style={{ color: 'var(--muted)' }}>버튼을 눌러 데모를 확인하세요.</div>
            ) : (
              <div className="demo-content">
                {/* 게시판 데모 */}
                {currentDemo === 'board' && (
                  <>
                    <div className="title">
                      📋 게시판/지식 허브 <span className="badge ok">샘플</span>
                    </div>
                    <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
                      <strong>🎯 목적:</strong> 실제 사용자의 경험·후기를 수집해 "웨딩 지식 데이터베이스" 구축, 플래너 리뷰로 신뢰도 강화, 커플 전용 공간 제공
                    </p>
                    <div className="demo-inner-box">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* 탭 메뉴 */}
                        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
                          <button style={{ padding: '6px 12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 6, color: 'var(--accent)', fontSize: 12, cursor: 'pointer' }}>
                            예비부부 게시판
                          </button>
                          <button style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6, color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
                            플래너 리뷰
                          </button>
                          <button style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6, color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
                            커플 전용 공간
                          </button>
                        </div>
                        {/* 게시글 목록 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>강남 A 웨딩홀 후기 (자연광 최고!)</div>
                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>2일 전</span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0', lineHeight: 1.5 }}>
                              자연광이 정말 좋고, 직원분들 서비스도 친절하셨어요. 다만 주차 공간이 좀 협소했고, 평일 대관료가 800만원이었습니다.
                            </p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, padding: '4px 8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 4, color: 'var(--accent)' }}>#강남</span>
                              <span style={{ fontSize: 10, padding: '4px 8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 4, color: 'var(--accent)' }}>#웨딩홀</span>
                              <span style={{ fontSize: 10, padding: '4px 8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 4, color: 'var(--accent)' }}>#자연광</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="foot" style={{ marginTop: 10 }}>
                      <span className="chip">예비부부 게시판</span>
                      <span className="chip">플래너 리뷰</span>
                      <span className="chip">커플 전용 공간</span>
                      <span className="chip">리뷰 자동 요약</span>
                    </div>
                  </>
                )}
                {/* 다른 데모들도 유사하게 구현 */}
                {currentDemo !== 'board' && (
                  <div style={{ color: 'var(--muted)', padding: 20, textAlign: 'center' }}>
                    {currentDemo} 데모 내용은 구현 중입니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

