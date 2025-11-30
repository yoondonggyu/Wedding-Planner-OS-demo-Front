<script setup lang="ts">
const steps = [
  {
    title: '1. 견적 수집 & 업로드',
    detail: '엑셀/사진/녹음 파일을 업로드하면 OCR+STT로 구조화된 데이터 생성',
  },
  {
    title: '2. AI 분석 & 리포트',
    detail:
      '시장 평균가와 비교하여 과다 항목 알림, 감정/리스크 진단, 협상 팁 제공',
  },
  {
    title: '3. 일정·예산 자동화',
    detail: '웨딩 D-Day 캘린더, 결제 알람, 체크리스트와 연동',
  },
  {
    title: '4. 커뮤니케이션 기록',
    detail: '플래너, 파트너 업체, 예비부부간 음성/텍스트 대화를 자동 요약',
  },
]
</script>

<template>
  <section class="section" id="flow">
    <div class="container">
      <div class="section-title">
        <h2>Core Data Layer</h2>
        <span class="hint">실제 현장에서 쌓이는 데이터 흐름</span>
      </div>
      <div class="flow-grid">
        <article class="flow-step" v-for="step in steps" :key="step.title">
          <span class="badge" style="margin-bottom: 6px">프로세스</span>
          <h3 style="margin: 6px 0 8px">{{ step.title }}</h3>
          <p style="color: var(--muted); font-size: 14px">{{ step.detail }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

