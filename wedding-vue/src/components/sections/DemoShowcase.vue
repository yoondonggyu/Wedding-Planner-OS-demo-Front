<script setup lang="ts">
import { ref } from 'vue'

type DemoType = 'board' | 'chat' | 'calendar' | 'budget' | 'voice' | 'vendor' | 'vendor-message' | null

const currentDemo = ref<DemoType>(null)

function openDemo(kind: DemoType) {
  currentDemo.value = kind
}
</script>

<template>
  <section class="section" id="demo">
    <div class="container">
      <div class="section-title">
        <h2>빠른 데모</h2>
        <span class="hint">실제 데이터 연결 전 시나리오 미리보기</span>
      </div>
      <div class="card">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 10px">
          <button class="btn" type="button" :class="{ active: currentDemo === 'board' }" @click="openDemo('board')">
            📋 게시판
          </button>
          <button class="btn" type="button" :class="{ active: currentDemo === 'chat' }" @click="openDemo('chat')">
            🤖 챗봇
          </button>
          <button
            class="btn"
            type="button"
            :class="{ active: currentDemo === 'calendar' }"
            @click="openDemo('calendar')"
          >
            📅 일정관리
          </button>
          <button class="btn" type="button" :class="{ active: currentDemo === 'budget' }" @click="openDemo('budget')">
            💰 예산서
          </button>
          <button class="btn" type="button" :class="{ active: currentDemo === 'voice' }" @click="openDemo('voice')">
            🎤 음성비서
          </button>
          <button class="btn" type="button" :class="{ active: currentDemo === 'vendor' }" @click="openDemo('vendor')">
            💍 업체추천
          </button>
          <button class="btn" type="button" :class="{ active: currentDemo === 'vendor-message' }" @click="openDemo('vendor-message')">
            💬 벤더메시지
          </button>
        </div>
        <div
          id="demo-box"
          class="demo-box"
        >
          <div v-if="!currentDemo" style="color: var(--muted)">버튼을 눌러 데모를 확인하세요.</div>

          <!-- 게시판 데모 -->
          <div v-else-if="currentDemo === 'board'" class="demo-content">
            <div class="title">
              📋 게시판/지식 허브 <span class="badge ok">샘플</span>
            </div>
            <p style="color: var(--muted); margin-bottom: 12px">
              <strong>🎯 목적:</strong> 실제 사용자의 경험·후기를 수집해 "웨딩 지식 데이터베이스" 구축, 플래너 리뷰로
              신뢰도 강화, 커플 전용 공간 제공
            </p>

            <div class="demo-inner-box">
              <div style="display: flex; flex-direction: column; gap: 12px">
                <!-- 탭 메뉴 -->
                <div
                  style="
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 8px;
                  "
                >
                  <button
                    style="
                      padding: 6px 12px;
                      background: rgba(139, 92, 246, 0.2);
                      border: 1px solid rgba(139, 92, 246, 0.3);
                      border-radius: 6px;
                      color: var(--accent);
                      font-size: 12px;
                      cursor: pointer;
                    "
                  >
                    예비부부 게시판
                  </button>
                  <button
                    style="
                      padding: 6px 12px;
                      background: transparent;
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      border-radius: 6px;
                      color: var(--muted);
                      font-size: 12px;
                      cursor: pointer;
                    "
                  >
                    플래너 리뷰
                  </button>
                  <button
                    style="
                      padding: 6px 12px;
                      background: transparent;
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      border-radius: 6px;
                      color: var(--muted);
                      font-size: 12px;
                      cursor: pointer;
                    "
                  >
                    커플 전용 공간
                  </button>
                </div>

                <!-- 게시글 목록 -->
                <div style="display: flex; flex-direction: column; gap: 8px">
                  <div
                    style="
                      padding: 12px;
                      background: rgba(255, 255, 255, 0.03);
                      border-radius: 8px;
                      border: 1px solid rgba(255, 255, 255, 0.06);
                    "
                  >
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px">
                      <div style="font-weight: 600; font-size: 14px">강남 A 웨딩홀 후기 (자연광 최고!)</div>
                      <span style="font-size: 11px; color: var(--muted)">2일 전</span>
                    </div>
                    <p style="font-size: 12px; color: var(--muted); margin: 4px 0; line-height: 1.5">
                      자연광이 정말 좋고, 직원분들 서비스도 친절하셨어요. 다만 주차 공간이 좀 협소했고, 평일 대관료가
                      800만원이었습니다.
                    </p>
                    <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap">
                      <span
                        style="
                          font-size: 10px;
                          padding: 4px 8px;
                          background: rgba(139, 92, 246, 0.1);
                          border-radius: 4px;
                          color: var(--accent);
                        "
                        >#강남</span
                      >
                      <span
                        style="
                          font-size: 10px;
                          padding: 4px 8px;
                          background: rgba(139, 92, 246, 0.1);
                          border-radius: 4px;
                          color: var(--accent);
                        "
                        >#웨딩홀</span
                      >
                      <span
                        style="
                          font-size: 10px;
                          padding: 4px 8px;
                          background: rgba(139, 92, 246, 0.1);
                          border-radius: 4px;
                          color: var(--accent);
                        "
                        >#자연광</span
                      >
                    </div>
                  </div>

                  <div
                    style="
                      padding: 12px;
                      background: rgba(255, 255, 255, 0.03);
                      border-radius: 8px;
                      border: 1px solid rgba(255, 255, 255, 0.06);
                    "
                  >
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px">
                      <div style="font-weight: 600; font-size: 14px">드레스샵 B 후기 - 가성비 좋아요</div>
                      <span style="font-size: 11px; color: var(--muted)">5일 전</span>
                    </div>
                    <p style="font-size: 12px; color: var(--muted); margin: 4px 0; line-height: 1.5">
                      150만원에 대여했는데 퀄리티가 정말 좋았어요. 피팅도 꼼꼼하게 해주셨고요.
                    </p>
                    <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap">
                      <span
                        style="
                          font-size: 10px;
                          padding: 4px 8px;
                          background: rgba(139, 92, 246, 0.1);
                          border-radius: 4px;
                          color: var(--accent);
                        "
                        >#드레스</span
                      >
                      <span
                        style="
                          font-size: 10px;
                          padding: 4px 8px;
                          background: rgba(139, 92, 246, 0.1);
                          border-radius: 4px;
                          color: var(--accent);
                        "
                        >#가성비</span
                      >
                    </div>
                  </div>
                </div>

                <!-- 리뷰 자동 요약 기능 -->
                <div
                  style="
                    margin-top: 12px;
                    padding: 12px;
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                  "
                >
                  <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px">
                    🔍 리뷰 자동 요약 기능 (LLM Summarization)
                  </div>
                  <p style="font-size: 12px; color: var(--muted); margin: 4px 0 8px">
                    "이 웨딩홀 10개 리뷰 요약해줘" → 한 문단으로 정리
                  </p>
                  <div style="padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; font-size: 12px; line-height: 1.6">
                    <strong>요약 결과:</strong> A 웨딩홀은 자연광이 우수하고 서비스가 친절하다는 긍정적 평가가 많습니다.
                    다만 주차 공간이 협소하다는 지적이 있으며, 평균 대관료는 800만원 수준입니다.
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap">
                    <span
                      style="
                        font-size: 11px;
                        padding: 4px 8px;
                        background: rgba(16, 185, 129, 0.1);
                        border-radius: 4px;
                        color: #a7f3d0;
                      "
                      >✅ 긍정: 자연광, 친절한 서비스</span
                    >
                    <span
                      style="
                        font-size: 11px;
                        padding: 4px 8px;
                        background: rgba(245, 158, 11, 0.1);
                        border-radius: 4px;
                        color: #fde68a;
                      "
                      >⚠️ 개선: 주차 공간 협소</span
                    >
                    <span
                      style="
                        font-size: 11px;
                        padding: 4px 8px;
                        background: rgba(139, 92, 246, 0.1);
                        border-radius: 4px;
                        color: #c4b5fd;
                      "
                      >💰 평균 가격: 800만원</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div
              style="
                margin-top: 12px;
                padding: 12px;
                background: rgba(139, 92, 246, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(139, 92, 246, 0.2);
              "
            >
              <div style="font-size: 13px; margin-bottom: 6px"><b>📌 세부 기능:</b></div>
              <ul style="font-size: 12px; margin: 4px 0; padding-left: 20px; line-height: 1.8; color: var(--muted)">
                <li>
                  <strong>예비부부 게시판:</strong> 웨딩홀 리뷰, 드레스 후기, 견적 공유, 지역별 추천, 태그/카테고리 기반
                  정리
                </li>
                <li><strong>플래너 리뷰 게시판:</strong> 전문 플래너들의 경험 공유, 플래너의 포트폴리오 DB와 연결</li>
                <li><strong>커플 전용 공간:</strong> 둘만의 일기/아이디어/사진 업로드, 비공개 저장 공간</li>
                <li><strong>리뷰 자동 요약:</strong> 감성 분석(긍정/부정 포인트), 평균 가격, 장단점 자동 추출</li>
              </ul>
            </div>

            <div class="foot" style="margin-top: 10px">
              <span class="chip">예비부부 게시판</span>
              <span class="chip">플래너 리뷰</span>
              <span class="chip">커플 전용 공간</span>
              <span class="chip">리뷰 자동 요약</span>
            </div>
          </div>

          <!-- 챗봇 데모 -->
          <div v-else-if="currentDemo === 'chat'" class="demo-content">
            <div class="title">
              🤖 챗봇 (AI Planner Chat) <span class="badge wip">샘플</span>
            </div>
            <p style="color: var(--muted); margin-bottom: 12px">
              <strong>🎯 목적:</strong> "사람 플래너"처럼 준비 전 과정을 함께하는 AI, 정보를 모아서 정리해주는
              Personal Knowledge Manager
            </p>

            <div class="demo-inner-box">
              <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto">
                <!-- 봇 메시지 -->
                <div style="display: flex; gap: 10px; align-items: start">
                  <div
                    style="
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, var(--accent), var(--accent-2));
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                    "
                  >
                    🤖
                  </div>
                  <div style="flex: 1; background: var(--soft); padding: 12px 16px; border-radius: 12px; font-size: 14px">
                    안녕하세요! AI Wedding Planner OS입니다. 무엇을 도와드릴까요? 😊
                  </div>
                </div>

                <!-- 사용자 메시지 -->
                <div style="display: flex; gap: 10px; align-items: start; flex-direction: row-reverse">
                  <div
                    style="
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, var(--accent), var(--accent-2));
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                    "
                  >
                    👤
                  </div>
                  <div
                    style="
                      flex: 1;
                      background: linear-gradient(135deg, var(--accent), var(--accent-2));
                      color: #0b0d12;
                      padding: 12px 16px;
                      border-radius: 12px;
                      font-size: 14px;
                      font-weight: 500;
                    "
                  >
                    내 결혼식 날짜 언제였지?
                  </div>
                </div>

                <!-- 봇 응답 (개인 데이터 기반) -->
                <div style="display: flex; gap: 10px; align-items: start">
                  <div
                    style="
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, var(--accent), var(--accent-2));
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                    "
                  >
                    🤖
                  </div>
                  <div style="flex: 1; background: var(--soft); padding: 12px 16px; border-radius: 12px; font-size: 14px">
                    <div style="margin-bottom: 8px">
                      캘린더를 확인한 결과, 결혼식 날짜는
                      <strong style="color: var(--accent)">2025년 5월 10일 (토요일)</strong>입니다! 🎉
                    </div>
                    <div
                      style="
                        padding: 10px;
                        background: rgba(139, 92, 246, 0.1);
                        border-radius: 8px;
                        border-left: 3px solid var(--accent);
                        margin-top: 8px;
                        font-size: 13px;
                      "
                    >
                      <div style="font-weight: 600; margin-bottom: 6px">📅 현재까지 진행 상황:</div>
                      <ul style="margin: 4px 0; padding-left: 20px; line-height: 1.8">
                        <li>D-170일 남았습니다</li>
                        <li>웨딩홀 계약 완료 (2024년 12월)</li>
                        <li>스드메 업체 선정 완료</li>
                        <li>드레스 피팅 예약: 3월 15일</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- 사용자 메시지 -->
                <div style="display: flex; gap: 10px; align-items: start; flex-direction: row-reverse">
                  <div
                    style="
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, var(--accent), var(--accent-2));
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                    "
                  >
                    👤
                  </div>
                  <div
                    style="
                      flex: 1;
                      background: linear-gradient(135deg, var(--accent), var(--accent-2));
                      color: #0b0d12;
                      padding: 12px 16px;
                      border-radius: 12px;
                      font-size: 14px;
                      font-weight: 500;
                    "
                  >
                    이번 달 예산 상황 알려줘
                  </div>
                </div>

                <!-- 봇 응답 (예산서 데이터 기반) -->
                <div style="display: flex; gap: 10px; align-items: start">
                  <div
                    style="
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, var(--accent), var(--accent-2));
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                    "
                  >
                    🤖
                  </div>
                  <div style="flex: 1; background: var(--soft); padding: 12px 16px; border-radius: 12px; font-size: 14px">
                    <div style="margin-bottom: 8px">예산서를 분석한 결과입니다:</div>
                    <div
                      style="
                        padding: 10px;
                        background: rgba(139, 92, 246, 0.1);
                        border-radius: 8px;
                        margin-top: 8px;
                        font-size: 13px;
                      "
                    >
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px">
                        <div><strong>총 예산:</strong> 5,000만원</div>
                        <div><strong>현재 지출:</strong> 1,850만원</div>
                        <div><strong>잔여 예산:</strong> 3,150만원</div>
                        <div><strong>사용률:</strong> 37%</div>
                      </div>
                      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1)">
                        <div style="font-weight: 600; margin-bottom: 4px">💸 이번 달 주요 지출:</div>
                        <ul style="margin: 4px 0; padding-left: 20px; line-height: 1.8">
                          <li>웨딩홀 계약금: 500만원</li>
                          <li>스드메 선금: 300만원</li>
                          <li>드레스 대여비: 150만원</li>
                        </ul>
                      </div>
                      <div
                        style="
                          margin-top: 8px;
                          padding: 8px;
                          background: rgba(16, 185, 129, 0.1);
                          border-radius: 6px;
                          border-left: 3px solid var(--ok);
                        "
                      >
                        ✅ 예산 범위 내에서 잘 관리되고 있습니다!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style="
                margin-top: 12px;
                padding: 12px;
                background: rgba(139, 92, 246, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(139, 92, 246, 0.2);
              "
            >
              <div style="font-size: 13px; margin-bottom: 6px"><b>📌 세부 기능:</b></div>
              <ul style="font-size: 12px; margin: 4px 0; padding-left: 20px; line-height: 1.8; color: var(--muted)">
                <li>
                  <strong>개인 DB 기반 상담:</strong> 캘린더 일정, 예산서 지출 내역, 커플 게시판 기록 → 모두 읽어서
                  "개인 맞춤" 조언 제공
                </li>
                <li>
                  <strong>공유 데이터 기반 정보:</strong> 웨딩홀 평균가, 지역별 견적, 플래너 후기/평점, 드레스샵/스튜디오
                  정보
                </li>
                <li>
                  <strong>개인 정보 자동 정리:</strong> 필기/텍스트 → 표/리스트/예산 Category로 정리, "지금까지 준비
                  상황 요약해줘"
                </li>
                <li>
                  <strong>웨딩홀 탐색·추천:</strong> 조건(예산/지역/인원/스타일) 입력 → 후보 자동 생성, "리스트로 보여줘 /
                  비교해줘"
                </li>
                <li>
                  <strong>게시판/일정/예산 통합 관리:</strong> 리뷰 요약, 일정 자동 조정, 예산 초과 시 경고,
                  플래너/홀/아이템 추천
                </li>
              </ul>
            </div>

            <div class="foot" style="margin-top: 10px">
              <span class="chip">개인 DB 기반</span>
              <span class="chip">공유 데이터</span>
              <span class="chip">자동 정리</span>
              <span class="chip">웨딩홀 추천</span>
              <span class="chip">통합 관리</span>
            </div>
          </div>

          <!-- 일정관리 데모 -->
          <div v-else-if="currentDemo === 'calendar'" class="demo-content">
            <div class="title">
              📅 개인화 일정 관리(캘린더) <span class="badge wip">샘플</span>
            </div>
            <p style="color: var(--muted); margin-bottom: 12px">
              <strong>🎯 목적:</strong> 결혼식까지 남은 기간을 기준으로 자동으로 할 일을 배치하고 개인 맞춤형 타임라인을
              만들어주는 기능
            </p>

            <div class="demo-inner-box">
              <div style="display: flex; flex-direction: column; gap: 12px">
                <!-- D-Day 정보 -->
                <div
                  style="
                    padding: 12px;
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 8px;
                    border-left: 3px solid var(--accent);
                  "
                >
                  <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px">📅 D-Day 기반 타임라인</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--accent); margin: 8px 0">D-170</div>
                  <div style="font-size: 12px; color: var(--muted)">결혼식: 2025년 5월 10일 (토요일)</div>
                </div>

                <!-- Todo 리스트 -->
                <div>
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">📋 이번 주 할 일</div>
                  <div style="display: flex; flex-direction: column; gap: 6px">
                    <div
                      style="
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 6px;
                        border-left: 3px solid var(--ok);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                      "
                    >
                      <div>
                        <div style="font-size: 13px; font-weight: 500">웨딩홀 계약금 결제</div>
                        <div style="font-size: 11px; color: var(--muted); margin-top: 2px">
                          담당: 공동 • 우선순위: 높음
                        </div>
                      </div>
                      <span style="font-size: 11px; color: var(--ok)">완료</span>
                    </div>
                    <div
                      style="
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 6px;
                        border-left: 3px solid var(--warn);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                      "
                    >
                      <div>
                        <div style="font-size: 13px; font-weight: 500">청첩장 초안 확정</div>
                        <div style="font-size: 11px; color: var(--muted); margin-top: 2px">
                          담당: 신부 • 우선순위: 중간
                        </div>
                      </div>
                      <span style="font-size: 11px; color: var(--warn)">진행중</span>
                    </div>
                    <div
                      style="
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 6px;
                        border-left: 3px solid var(--muted);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                      "
                    >
                      <div>
                        <div style="font-size: 13px; font-weight: 500">하객 명단 1차 작성</div>
                        <div style="font-size: 11px; color: var(--muted); margin-top: 2px">
                          담당: 공동 • 우선순위: 낮음
                        </div>
                      </div>
                      <span style="font-size: 11px; color: var(--muted)">대기</span>
                    </div>
                  </div>
                </div>

                <!-- 알림 -->
                <div
                  style="
                    padding: 10px;
                    background: rgba(245, 158, 11, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                  "
                >
                  <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px">🔔 알림</div>
                  <div style="font-size: 12px; color: var(--muted)">3월 15일 - 드레스 피팅 예약</div>
                  <div style="font-size: 12px; color: var(--muted)">3월 20일 - 스드메 잔금 납부</div>
                </div>

                <!-- 챗봇 연동 -->
                <div style="padding: 10px; background: rgba(139, 92, 246, 0.1); border-radius: 8px">
                  <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px">💬 챗봇 연동</div>
                  <div style="font-size: 11px; color: var(--muted); line-height: 1.6">
                    "다음 주 해야 할 일 알려줘" • "홀 계약 일정 앞으로 당겨줘"
                  </div>
                </div>
              </div>
            </div>

            <div
              style="
                margin-top: 12px;
                padding: 12px;
                background: rgba(139, 92, 246, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(139, 92, 246, 0.2);
              "
            >
              <div style="font-size: 13px; margin-bottom: 6px"><b>📌 세부 기능:</b></div>
              <ul style="font-size: 12px; margin: 4px 0; padding-left: 20px; line-height: 1.8; color: var(--muted)">
                <li>
                  <strong>D-Day 기반 타임라인 자동 생성:</strong> 예식일 입력 → 1년치 체크리스트 자동 구성
                </li>
                <li><strong>Todo 리스트 & 세부 작업:</strong> 우선순위, 맡은 사람(신랑/신부/공동), 진행률</li>
                <li><strong>알림 기능:</strong> 중요한 일정 리마인드, 예산 결제일/계약금 납부일 알림</li>
                <li><strong>챗봇 연동:</strong> "다음 주 해야 할 일 알려줘", "홀 계약 일정 앞으로 당겨줘"</li>
              </ul>
            </div>

            <div class="foot" style="margin-top: 10px">
              <span class="chip">D-Day 타임라인</span>
              <span class="chip">Todo 리스트</span>
              <span class="chip">알림 기능</span>
              <span class="chip">챗봇 연동</span>
            </div>
          </div>

          <!-- 예산서 데모 -->
          <div v-else-if="currentDemo === 'budget'" class="demo-content">
            <div class="title">
              💰 Excel 형식의 예산서 <span class="badge ok">샘플</span>
            </div>
            <p style="color: var(--muted); margin-bottom: 12px">
              <strong>🎯 목적:</strong> 헬 같은 예산 관리(홀/드레스/스냅/혼수…)를 "1개의 대시보드"에 정리해주는 UI
            </p>

            <div class="demo-inner-box">
              <div style="display: flex; flex-direction: column; gap: 12px">
                <!-- 예산 요약 -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px">
                  <div
                    style="
                      padding: 12px;
                      background: rgba(139, 92, 246, 0.1);
                      border-radius: 8px;
                      text-align: center;
                    "
                  >
                    <div style="font-size: 11px; color: var(--muted); margin-bottom: 4px">총 예산</div>
                    <div style="font-size: 20px; font-weight: 700; color: var(--accent)">5,000만원</div>
                  </div>
                  <div
                    style="
                      padding: 12px;
                      background: rgba(16, 185, 129, 0.1);
                      border-radius: 8px;
                      text-align: center;
                    "
                  >
                    <div style="font-size: 11px; color: var(--muted); margin-bottom: 4px">현재 지출</div>
                    <div style="font-size: 20px; font-weight: 700; color: var(--ok)">1,850만원</div>
                  </div>
                  <div
                    style="
                      padding: 12px;
                      background: rgba(34, 211, 238, 0.1);
                      border-radius: 8px;
                      text-align: center;
                    "
                  >
                    <div style="font-size: 11px; color: var(--muted); margin-bottom: 4px">잔여 예산</div>
                    <div style="font-size: 20px; font-weight: 700; color: var(--accent-2)">3,150만원</div>
                  </div>
                  <div
                    style="
                      padding: 12px;
                      background: rgba(245, 158, 11, 0.1);
                      border-radius: 8px;
                      text-align: center;
                    "
                  >
                    <div style="font-size: 11px; color: var(--muted); margin-bottom: 4px">사용률</div>
                    <div style="font-size: 20px; font-weight: 700; color: var(--warn)">37%</div>
                  </div>
                </div>

                <!-- 예산 테이블 -->
                <div>
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">📊 예산 항목별 현황</div>
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px">
                    <thead>
                      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1)">
                        <th style="text-align: left; padding: 8px 4px; color: var(--muted); font-weight: 500">항목</th>
                        <th style="text-align: right; padding: 8px 4px; color: var(--muted); font-weight: 500">예산</th>
                        <th style="text-align: right; padding: 8px 4px; color: var(--muted); font-weight: 500">지출</th>
                        <th style="text-align: center; padding: 8px 4px; color: var(--muted); font-weight: 500">비율</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05)">
                        <td style="padding: 8px 4px">웨딩홀</td>
                        <td style="text-align: right; padding: 8px 4px">1,500만원</td>
                        <td style="text-align: right; padding: 8px 4px; color: var(--ok)">500만원</td>
                        <td style="text-align: center; padding: 8px 4px; color: var(--ok)">33%</td>
                      </tr>
                      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05)">
                        <td style="padding: 8px 4px">스드메</td>
                        <td style="text-align: right; padding: 8px 4px">800만원</td>
                        <td style="text-align: right; padding: 8px 4px; color: var(--ok)">300만원</td>
                        <td style="text-align: center; padding: 8px 4px; color: var(--ok)">38%</td>
                      </tr>
                      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05)">
                        <td style="padding: 8px 4px">드레스</td>
                        <td style="text-align: right; padding: 8px 4px">200만원</td>
                        <td style="text-align: right; padding: 8px 4px; color: var(--ok)">150만원</td>
                        <td style="text-align: center; padding: 8px 4px; color: var(--warn)">75%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 항목 추천 -->
                <div style="padding: 10px; background: rgba(139, 92, 246, 0.1); border-radius: 8px">
                  <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px">💡 AI Budget Advisor - 항목 추천</div>
                  <div style="font-size: 11px; color: var(--muted); line-height: 1.6">
                    예산 대비 적절한 배분률 자동 제안 • 지역/규모/스타일 기반 평균값 추천
                  </div>
                </div>

                <!-- 챗봇 연동 -->
                <div style="padding: 10px; background: rgba(34, 211, 238, 0.1); border-radius: 8px">
                  <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px">💬 챗봇 연동</div>
                  <div style="font-size: 11px; color: var(--muted); line-height: 1.6">
                    "이번 달 예산 상황 요약해줘" • "웨딩홀 항목에 80만 원 추가해줘" • 초과 항목 자동 경고
                  </div>
                </div>
              </div>
            </div>

            <div
              style="
                margin-top: 12px;
                padding: 12px;
                background: rgba(139, 92, 246, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(139, 92, 246, 0.2);
              "
            >
              <div style="font-size: 13px; margin-bottom: 6px"><b>📌 세부 기능:</b></div>
              <ul style="font-size: 12px; margin: 4px 0; padding-left: 20px; line-height: 1.8; color: var(--muted)">
                <li>
                  <strong>직접 입력 가능한 예산 테이블:</strong> 항목/예산/실제 지출/비고 입력, 자동 합계 / 카테고리별
                  통계
                </li>
                <li>
                  <strong>항목 추천 기능 (AI Budget Advisor):</strong> 예산 대비 적절한 배분률 자동 제안, "지역/규모/스타일
                  기반 평균값" 추천
                </li>
                <li><strong>CSV/XLSX 다운로드:</strong> 실제 excel처럼 다운로드/업로드</li>
                <li>
                  <strong>챗봇 연동:</strong> "이번 달 예산 상황 요약해줘", "웨딩홀 항목에 80만 원 추가해줘", 초과 항목
                  자동 경고
                </li>
              </ul>
            </div>

            <div class="foot" style="margin-top: 10px">
              <span class="chip">직접 입력 테이블</span>
              <span class="chip">항목 추천</span>
              <span class="chip">CSV/XLSX 다운로드</span>
              <span class="chip">챗봇 연동</span>
            </div>
          </div>

          <!-- 음성 비서 데모 -->
          <div v-else-if="currentDemo === 'voice'" class="demo-content">
            <div class="title">
              🎤 24/7 음성 비서 (Voice Personal Assistant) <span class="badge wip">샘플</span>
            </div>
            <p style="color: var(--muted); font-size: 13px">
              🚗 <b>상황:</b> 사용자가 출근 중 운전하면서 음성 메시지로 질문
            </p>
            <div
              style="
                margin-top: 12px;
                padding: 12px;
                background: rgba(34, 211, 238, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(34, 211, 238, 0.2);
              "
            >
              <div style="font-size: 13px; margin-bottom: 8px"><b>🎤 사용자 음성 메시지 (08:30):</b></div>
              <p style="font-size: 13px; margin: 0">
                "오늘 할 일이 뭐가 있었지? 그리고 이번 주말까지 해야 할 것도 알려줘. 드레스 예약은 어떻게 됐어?"
              </p>
            </div>
            <div style="margin-top: 12px; padding: 12px; background: rgba(139, 92, 246, 0.1); border-radius: 8px">
              <div style="font-size: 13px; margin-bottom: 6px"><b>🔊 AI 브리핑 (1분 후):</b></div>
              <p style="font-size: 13px; margin: 0">
                "오늘은 오후 7시에 스드메 업체와 상담 예정입니다. 이번 주말까지는 웨딩홀 계약금 결제, 청첩장 초안 확정,
                하객 명단 1차 작성이 필요합니다. 드레스는 A업체에서 3벌 추린 상태이고, 이번 주 토요일 오후 2시 피팅
                예약되어 있습니다."
              </p>
            </div>
            <div
              style="
                margin-top: 12px;
                padding: 12px;
                background: rgba(16, 185, 129, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(16, 185, 129, 0.2);
              "
            >
              <div style="font-size: 13px; margin-bottom: 8px"><b>📋 오늘 할 일:</b></div>
              <ul style="font-size: 13px; margin: 6px 0; padding-left: 20px">
                <li>19:00 - 스드메 업체 상담 (강남점)</li>
                <li>허니문 패키지 견적 3곳 비교</li>
              </ul>
            </div>
            <div
              style="
                margin-top: 12px;
                padding: 12px;
                background: rgba(245, 158, 11, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(245, 158, 11, 0.2);
              "
            >
              <div style="font-size: 13px; margin-bottom: 8px"><b>⚠️ 주말까지 마감:</b></div>
              <ul style="font-size: 13px; margin: 6px 0; padding-left: 20px">
                <li>웨딩홀 계약금 결제 (D-90)</li>
                <li>청첩장 초안 확정</li>
                <li>하객 명단 1차 작성</li>
              </ul>
            </div>
            <div class="foot" style="margin-top: 10px">
              <span class="chip">STT</span><span class="chip">TTS</span><span class="chip">LLM</span
              ><span class="chip">비동기 메시지</span>
            </div>
            <p style="font-size: 12px; margin-top: 10px; color: var(--muted)">
              💡 <i>핸즈프리로 언제든 질문하고, AI가 정리된 브리핑을 음성으로 전달</i>
            </p>
          </div>

          <!-- 업체 추천 데모 -->
          <div v-else-if="currentDemo === 'vendor'" class="demo-content">
            <div class="title">
              💍 업체 매칭 & 추천 <span class="badge ok">샘플</span>
            </div>
            <p style="color: var(--muted); margin-bottom: 12px">
              <strong>🎯 목적:</strong> 결혼식 프로필(규모·예산·스타일)에 맞춰 아이폰 스냅, 사회자, 축가, 웨딩 사진, 야외 식장을 매칭·추천해 주는 '웨딩 벤더 매칭 엔진'
            </p>

            <div class="demo-inner-box">
              <div style="display: flex; flex-direction: column; gap: 12px">
                <!-- 프로필 요약 -->
                <div
                  style="
                    padding: 12px;
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 8px;
                    border-left: 3px solid var(--accent);
                  "
                >
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">📋 현재 선택된 프로필</div>
                  <div style="font-size: 12px; line-height: 1.6">
                    <div><strong>예식일:</strong> 2025년 5월 10일</div>
                    <div><strong>규모:</strong> 중규모 (50~150명)</div>
                    <div><strong>예산:</strong> 3,000만원</div>
                    <div><strong>지역:</strong> 서울시 마포구</div>
                    <div><strong>스타일:</strong> 실내 + 야외 (우천 대안 필수)</div>
                  </div>
                </div>

                <!-- 카테고리 탭 -->
                <div>
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">🏷️ 카테고리별 탐색</div>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap">
                    <button
                      style="
                        padding: 6px 12px;
                        background: rgba(139, 92, 246, 0.2);
                        border: 1px solid rgba(139, 92, 246, 0.3);
                        border-radius: 6px;
                        color: var(--accent);
                        font-size: 11px;
                        cursor: pointer;
                      "
                    >
                      📱 아이폰 스냅
                    </button>
                    <button
                      style="
                        padding: 6px 12px;
                        background: transparent;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 6px;
                        color: var(--muted);
                        font-size: 11px;
                        cursor: pointer;
                      "
                    >
                      🎤 사회자
                    </button>
                    <button
                      style="
                        padding: 6px 12px;
                        background: transparent;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 6px;
                        color: var(--muted);
                        font-size: 11px;
                        cursor: pointer;
                      "
                    >
                      🎵 축가
                    </button>
                    <button
                      style="
                        padding: 6px 12px;
                        background: transparent;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 6px;
                        color: var(--muted);
                        font-size: 11px;
                        cursor: pointer;
                      "
                    >
                      📸 웨딩 스튜디오
                    </button>
                    <button
                      style="
                        padding: 6px 12px;
                        background: transparent;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 6px;
                        color: var(--muted);
                        font-size: 11px;
                        cursor: pointer;
                      "
                    >
                      🏞️ 야외 식장
                    </button>
                  </div>
                </div>

                <!-- 업체 카드 예시 -->
                <div>
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">⭐ 추천 업체 (매칭 점수 순)</div>
                  <div style="display: flex; flex-direction: column; gap: 8px">
                    <!-- 업체 카드 1 -->
                    <div
                      style="
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.06);
                      "
                    >
                      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px">
                        <div>
                          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px">
                            스튜디오 아이폰스냅
                          </div>
                          <div style="font-size: 11px; color: var(--muted)">📱 아이폰 스냅</div>
                        </div>
                        <div style="display: flex; gap: 6px">
                          <span style="font-size: 11px; padding: 4px 8px; background: rgba(139, 92, 246, 0.1); border-radius: 4px; color: var(--accent)">
                            매칭 87점
                          </span>
                          <span style="font-size: 16px; cursor: pointer">🤍</span>
                        </div>
                      </div>
                      <div style="font-size: 12px; color: var(--muted); margin-bottom: 8px; line-height: 1.5">
                        아이폰으로 본식 전체를 자연스럽게 기록해 드립니다. 메이크업~폐식까지 풀데이 촬영, 보정본 300장 + 원본 전체 제공.
                      </div>
                      <div style="display: flex; gap: 12px; font-size: 11px; color: var(--muted)">
                        <span>📍 서울시 강남구</span>
                        <span>💰 40만원 ~ 70만원</span>
                        <span>⭐ 4.8 (23개 리뷰)</span>
                      </div>
                    </div>

                    <!-- 업체 카드 2 (야외 식장 - 우천 플랜) -->
                    <div
                      style="
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.06);
                      "
                    >
                      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px">
                        <div>
                          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px">
                            강남 야외 웨딩홀
                          </div>
                          <div style="font-size: 11px; color: var(--muted)">🏞️ 야외 식장</div>
                        </div>
                        <div style="display: flex; gap: 6px">
                          <span style="font-size: 11px; padding: 4px 8px; background: rgba(139, 92, 246, 0.1); border-radius: 4px; color: var(--accent)">
                            매칭 81점
                          </span>
                          <span style="font-size: 16px; cursor: pointer">❤️</span>
                        </div>
                      </div>
                      <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap">
                        <span
                          style="
                            font-size: 10px;
                            padding: 4px 8px;
                            background: rgba(139, 92, 246, 0.2);
                            border-radius: 4px;
                            color: var(--accent);
                          "
                          >🌧️ 우천 시 실내 대체 가능</span
                        >
                        <span
                          style="
                            font-size: 10px;
                            padding: 4px 8px;
                            background: rgba(139, 92, 246, 0.2);
                            border-radius: 4px;
                            color: var(--accent);
                          "
                          >🌧️ 우천 시 텐트 제공</span
                        >
                      </div>
                      <div style="font-size: 12px; color: var(--muted); margin-bottom: 8px; line-height: 1.5">
                        최대 120명 수용 가능한 야외 결혼식장. 우천 시 실내 대체 공간 및 텐트 옵션 제공. 주차 50대 가능.
                      </div>
                      <div style="display: flex; gap: 12px; font-size: 11px; color: var(--muted)">
                        <span>📍 서울시 강남구</span>
                        <span>💰 800만원 ~ 1,200만원</span>
                        <span>⭐ 4.6 (45개 리뷰)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 필터 & 정렬 -->
                <div
                  style="
                    padding: 10px;
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                  "
                >
                  <div style="font-size: 12px; font-weight: 600; margin-bottom: 6px">🔍 필터 & 정렬</div>
                  <div style="font-size: 11px; color: var(--muted); line-height: 1.6">
                    • 가격 범위: 0만원 ~ 1,500만원<br />
                    • 지역: 서울시 마포구<br />
                    • 우천 대안 필수 (야외 식장 전용)<br />
                    • 정렬: 매칭 점수 높은 순
                  </div>
                </div>

                <!-- 비교 기능 -->
                <div
                  style="
                    padding: 10px;
                    background: rgba(34, 211, 238, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(34, 211, 238, 0.2);
                  "
                >
                  <div style="font-size: 12px; font-weight: 600; margin-bottom: 6px">⚖️ 업체 비교 기능</div>
                  <div style="font-size: 11px; color: var(--muted); line-height: 1.6">
                    최대 3개 업체를 선택하여 가격, 위치, 우천 플랜, 평점을 표 형태로 한눈에 비교
                  </div>
                </div>
              </div>
            </div>

            <div
              style="
                margin-top: 12px;
                padding: 12px;
                background: rgba(139, 92, 246, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(139, 92, 246, 0.2);
              "
            >
              <div style="font-size: 13px; margin-bottom: 6px"><b>📌 세부 기능:</b></div>
              <ul style="font-size: 12px; margin: 4px 0; padding-left: 20px; line-height: 1.8; color: var(--muted)">
                <li>
                  <strong>결혼식 프로필 기반 매칭:</strong> 예식일, 규모, 예산, 지역, 스타일(실내/야외/우천 플랜) 입력 → 매칭 점수 계산
                </li>
                <li>
                  <strong>카테고리별 업체 탐색:</strong> 아이폰 스냅, 사회자, 축가, 웨딩 스튜디오, 야외 식장
                </li>
                <li>
                  <strong>업체 상세 정보:</strong> 가격 범위, 포트폴리오, 리뷰, 타입별 상세 정보(촬영 범위, 우천 플랜 등)
                </li>
                <li>
                  <strong>필터 & 정렬:</strong> 가격 범위, 지역, 우천 대안 필수, 매칭 점수/가격/리뷰 순 정렬
                </li>
                <li>
                  <strong>찜 & 비교:</strong> 관심 업체 저장, 최대 3개 업체 비교 기능
                </li>
                <li>
                  <strong>야외 결혼식 + 우천 플랜 특화:</strong> 우천 시 실내 대체/텐트 제공/환불 정책 뱃지 표시
                </li>
              </ul>
            </div>

            <div class="foot" style="margin-top: 10px">
              <span class="chip">프로필 기반 매칭</span>
              <span class="chip">카테고리별 탐색</span>
              <span class="chip">필터 & 정렬</span>
              <span class="chip">찜 & 비교</span>
              <span class="chip">우천 플랜 특화</span>
            </div>
            <p style="font-size: 12px; margin-top: 10px; color: var(--muted)">
              💡 <i>결혼식 프로필에 맞춰 최적의 업체를 추천하고, 가격·평점·리뷰를 비교하여 최종 선택 지원</i>
            </p>
          </div>

          <!-- 벤더 메시지 & 결제 리마인더 데모 -->
          <div v-else-if="currentDemo === 'vendor-message'" class="demo-content">
            <div class="title">
              💬 벤더 메시지 & 결제 리마인더 <span class="badge ok">샘플</span>
            </div>
            <p style="color: var(--muted); margin-bottom: 12px">
              <strong>🎯 목적:</strong> 웨딩 업체와의 계약·일정·결제 일정을 한 곳에서 관리하는 소통·리마인더 시스템
            </p>

            <div class="demo-inner-box">
              <div style="display: flex; flex-direction: column; gap: 12px">
                <!-- 기능 설명 -->
                <div
                  style="
                    padding: 12px;
                    background: rgba(34, 211, 238, 0.1);
                    border-radius: 8px;
                    border-left: 3px solid var(--accent-2);
                  "
                >
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">✨ 주요 기능</div>
                  <div style="font-size: 12px; line-height: 1.8">
                    <div>📨 <strong>벤더별 메시지 쓰레드:</strong> 카메라, 드레스, 본식스냅 등 업체별 대화방</div>
                    <div>📄 <strong>견적서·계약서 관리:</strong> 업로드·버전 관리, 서명 상태 확인</div>
                    <div>💰 <strong>결제 일정 관리:</strong> 계약금·중도금·잔금 납부일 자동 알림</div>
                    <div>📅 <strong>일정 자동 캘린더 반영:</strong> 결제 일정이 캘린더에 자동 등록</div>
                    <div>⚖️ <strong>벤더 비교:</strong> 가격·서비스 범위·후기를 나란히 비교</div>
                  </div>
                </div>

                <!-- 메시지 예시 -->
                <div>
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">💬 메시지 대화 예시</div>
                  <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 8px">
                    <div style="display: flex; justify-content: flex-end">
                      <div style="padding: 8px 12px; background: rgba(59, 130, 246, 0.3); border-radius: 8px; max-width: 70%; font-size: 12px">
                        안녕하세요. 견적서를 받고 싶습니다.
                      </div>
                    </div>
                    <div style="display: flex; justify-content: flex-start">
                      <div style="padding: 8px 12px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; max-width: 70%; font-size: 12px">
                        안녕하세요! 견적서를 보내드리겠습니다.
                      </div>
                    </div>
                    <div style="display: flex; justify-content: flex-start">
                      <div style="padding: 8px 12px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; max-width: 70%; font-size: 12px">
                        견적서를 확인해주세요. 추가 문의사항이 있으시면 언제든지 연락주세요.
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 결제 일정 예시 -->
                <div>
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">💰 결제 일정 관리</div>
                  <div style="display: flex; flex-direction: column; gap: 6px">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border-left: 3px solid #f59e0b">
                      <div>
                        <div style="font-weight: 600; font-size: 12px">계약금</div>
                        <div style="font-size: 11px; color: var(--muted)">납부일: 2024년 2월 1일</div>
                      </div>
                      <div style="text-align: right">
                        <div style="font-weight: 600; font-size: 13px">1,000,000원</div>
                        <div style="font-size: 11px; color: #f59e0b">대기 중</div>
                      </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border-left: 3px solid #f59e0b">
                      <div>
                        <div style="font-weight: 600; font-size: 12px">중도금</div>
                        <div style="font-size: 11px; color: var(--muted)">납부일: 2024년 3월 15일</div>
                      </div>
                      <div style="text-align: right">
                        <div style="font-weight: 600; font-size: 13px">2,000,000원</div>
                        <div style="font-size: 11px; color: #f59e0b">대기 중</div>
                      </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border-left: 3px solid #10b981">
                      <div>
                        <div style="font-weight: 600; font-size: 12px">잔금</div>
                        <div style="font-size: 11px; color: var(--muted)">납부일: 2024년 5월 1일</div>
                      </div>
                      <div style="text-align: right">
                        <div style="font-weight: 600; font-size: 13px">2,000,000원</div>
                        <div style="font-size: 11px; color: #10b981">완료</div>
                      </div>
                    </div>
                  </div>
                  <p style="font-size: 11px; margin-top: 8px; color: var(--muted); padding: 8px; background: rgba(34, 211, 238, 0.1); border-radius: 6px">
                    💡 결제 일정은 자동으로 캘린더에 등록되어 알림을 받을 수 있습니다!
                  </p>
                </div>

                <!-- 문서 관리 예시 -->
                <div>
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px">📄 문서 관리</div>
                  <div style="display: flex; flex-direction: column; gap: 6px">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px">
                      <div>
                        <div style="font-weight: 600; font-size: 12px">견적서 v1</div>
                        <div style="font-size: 11px; color: var(--muted)">견적서_v1.pdf</div>
                      </div>
                      <div style="font-size: 11px; color: #f59e0b">검토 중</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px">
                      <div>
                        <div style="font-weight: 600; font-size: 12px">계약서 v1</div>
                        <div style="font-size: 11px; color: var(--muted)">계약서_v1.pdf</div>
                      </div>
                      <div style="font-size: 11px; color: #10b981">서명 완료</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="foot" style="margin-top: 10px">
              <span class="chip">메시지 쓰레드</span><span class="chip">계약 관리</span><span class="chip">결제 일정</span
              ><span class="chip">문서 관리</span><span class="chip">벤더 비교</span><span class="chip">캘린더 연동</span>
            </div>
            <p style="font-size: 12px; margin-top: 10px; color: var(--muted)">
              💡 <i>여러 업체와의 계약 및 결제 일정을 한 곳에서 관리하고, 결제일·미팅 일정·서류 제출 등 다양한 알림을 자동화하여 누락을 방지</i>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.demo-content .title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge.wip {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--warn);
}

.badge.ok {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--ok);
}

.btn.active {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: var(--accent);
}

.foot {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-box {
  background: var(--soft);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  padding: 18px;
  border-radius: 12px;
  min-height: 200px;
}

[data-theme='light'] .demo-box {
  border-color: rgba(0, 0, 0, 0.1);
  background: var(--soft);
}

.demo-inner-box {
  background: var(--soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}

[data-theme='light'] .demo-inner-box {
  border-color: rgba(0, 0, 0, 0.1);
  background: var(--card);
}
</style>
