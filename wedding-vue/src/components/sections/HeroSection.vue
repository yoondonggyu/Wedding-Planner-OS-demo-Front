<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

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

function scrollToSection(anchor: string) {
  // 현재 경로가 홈이 아니면 홈으로 이동
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        const target = document.querySelector(anchor)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    })
  } else {
    // 이미 홈에 있으면 바로 스크롤
    const target = document.querySelector(anchor)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

function scrollToDemo() {
  scrollToSection('#demo')
}

function scrollToFeatures() {
  scrollToSection('#features')
}
</script>

<template>
  <section class="hero">
    <div class="glow" aria-hidden="true"></div>
    <div class="container hero-grid">
      <div>
        <span class="tag">
          🎤 Vision + Voice + LLM • 덤탱이 방지 • 24/7 AI 비서
        </span>
        <h1>
          AI가 예비 부부의
          <span
            style="
              background: linear-gradient(90deg, var(--accent), var(--accent-2));
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            "
          >
            감정·예산·스타일
          </span>
          을 이해하고 웨딩 전 과정을 자동 조율
        </h1>
        <p class="lead" style="color: var(--muted)">
          운전 중에도 음성으로 질문하고, 견적서 덤탱이 자동 탐지, 감정 분석
          기반 심리 코칭까지. <strong>Vision·Voice·LLM</strong>이 통합된 차세대
          웨딩 플래닝 OS.
        </p>
        <div class="cta" style="display: flex; gap: 12px; margin-top: 16px">
          <button class="btn primary" @click="scrollToDemo">빠른 데모 보기 ▶</button>
          <button class="btn" @click="scrollToFeatures">핵심 AI 기능 5가지 보기</button>
        </div>
        <div style="margin-top: 18px; display: flex; gap: 18px; flex-wrap: wrap">
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

      <div>
        <div class="hero-card">
          <div class="row" style="margin-bottom: 12px; flex-wrap: wrap">
            <div
              class="col"
              v-for="tile in heroTiles"
              :key="tile.title"
              style="flex: 1 1 250px"
            >
              <small style="color: var(--muted)">{{ tile.badge }}</small>
              <div style="font-weight: 700; margin-top: 6px">{{ tile.title }}</div>
              <p class="lead" style="font-size: 13px; color: var(--muted)">
                {{ tile.description }}
              </p>
            </div>
          </div>
          <div class="card" style="margin-top: 12px">
            <div class="title" style="display: flex; justify-content: space-between">
              <span>📅 핵심 일정</span>
              <span class="badge">실시간 동기화</span>
            </div>
            <ul style="margin: 12px 0 0; padding-left: 20px; color: var(--muted)">
              <li>이번 주 웨딩홀 계약금 결제 및 드레스 피팅</li>
              <li>하객 명단 자동 정리 + 챗봇 Q&A</li>
              <li>예산 초과 항목 AI 경보 & 대안 추천</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>



