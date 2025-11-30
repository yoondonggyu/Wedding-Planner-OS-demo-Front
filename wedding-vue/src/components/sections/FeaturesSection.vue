<script setup lang="ts">
import { ref } from 'vue'

interface Feature {
  title: string
  description: string
  chips: string[]
  details: string[]
}

const features: Feature[] = [
  {
    title: '게시판 · 커뮤니티',
    description:
      '예비부부/플래너 후기, 견적 비교, 자동 태그, 감성 분석을 한 화면에서 확인',
    chips: ['AI 태깅', 'JWT 인증', '실시간 요약'],
    details: [
      'AI가 악성 댓글/광고를 필터링하고, 감성 점수로 분위기 파악',
      '견적 캡처 업로드 시 OCR → 자동 태그 → 추천 해시태그 생성',
      'JWT 기반 세션으로 모바일/웹 어디서든 동일 로그인 상태 유지',
    ],
  },
  {
    title: 'AI 챗봇 & 큐레이터',
    description:
      '견적서를 업로드하면 OCR로 추출 후 GPT로 교정, 챗봇이 리스크와 대안 제안',
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
    description:
      '항목별 예상 vs 실제 지출을 자동 비교하고, 평균 단가 대비 과다 항목을 경고',
    chips: ['CSV 업로드', '시각화', '과소비 경보'],
    details: [
      '영수증/견적서 OCR → 항목 자동 분류 → 통합 예산표 업데이트',
      '카테고리별 평균 단가와 비교하여 과소·과대 소비 구간 시각화',
      '환불 일정/중도금 등을 캘린더와 연동해 리마인드',
    ],
  },
]

const showModal = ref(false)
const selectedFeature = ref<Feature | null>(null)

function openDetail(feature: Feature) {
  selectedFeature.value = feature
  showModal.value = true
}

function closeDetail() {
  showModal.value = false
  selectedFeature.value = null
}
</script>

<template>
  <section class="section" id="features">
    <div class="container">
      <div class="section-title">
        <h2>핵심 기능 한눈에</h2>
        <span class="hint">웨딩 준비의 모든 페인포인트를 AI로 해결</span>
      </div>

      <div class="feature-grid">
        <article
          class="feature-card"
          v-for="feature in features"
          :key="feature.title"
          @click="openDetail(feature)"
        >
          <div class="title" style="display: flex; justify-content: space-between">
            <strong>{{ feature.title }}</strong>
            <span class="badge">AI</span>
          </div>
          <p style="color: var(--muted); font-size: 14px">{{ feature.description }}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px">
            <span
              v-for="chip in feature.chips"
              :key="chip"
              class="chip"
              style="
                font-size: 12px;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
              "
            >
              {{ chip }}
            </span>
          </div>
        </article>
      </div>
    </div>

    <div v-if="showModal && selectedFeature" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <p class="modal-label">기능 상세</p>
            <h3>{{ selectedFeature.title }}</h3>
          </div>
          <button class="icon-btn" type="button" @click="closeDetail" aria-label="닫기">
            ✕
          </button>
        </div>
        <p class="modal-description">{{ selectedFeature.description }}</p>
        <ul class="detail-list">
          <li v-for="detail in selectedFeature.details" :key="detail">
            {{ detail }}
          </li>
        </ul>
        <div class="chip-row">
          <span v-for="chip in selectedFeature.chips" :key="chip" class="chip tag">
            {{ chip }}
          </span>
        </div>
        <div class="modal-actions">
          <button class="btn" type="button" @click="closeDetail">닫기</button>
          <button class="btn primary" type="button" @click="() => window.scrollTo({ top: 0, behavior: 'smooth' })">
            상단으로 이동
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feature-card {
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
  padding: 24px;
  backdrop-filter: blur(4px);
}

.modal-card {
  width: min(520px, 100%);
  background: var(--card);
  border-radius: 18px;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.modal-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 4px;
}

.modal-description {
  color: var(--muted);
  margin: 18px 0;
  line-height: 1.6;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 18px;
  margin: 0;
  color: var(--text);
}

.detail-list li {
  line-height: 1.5;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0;
}

.chip.tag {
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.12);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.3);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.icon-btn {
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  width: 36px;
  height: 36px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

@media (max-width: 600px) {
  .modal-card {
    padding: 22px;
  }

  .modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>

