<template>
  <div class="tone-selector">
    <h2>청첩장 문구 톤 선택</h2>
    <p class="subtitle">5가지 톤 중 마음에 드는 것을 선택하세요</p>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>AI가 5가지 톤의 문구를 생성하고 있습니다...</p>
    </div>

    <div v-else-if="tones.length > 0" class="tones-grid">
      <div
        v-for="(tone, index) in tones"
        :key="tone.tone"
        class="tone-card"
        :class="{ selected: selectedTone?.tone === tone.tone }"
        @click="selectTone(tone)"
      >
        <div class="tone-header">
          <span class="tone-number">{{ index + 1 }}</span>
          <h3>{{ tone.description }}</h3>
          <span v-if="selectedTone?.tone === tone.tone" class="check-mark">✓</span>
        </div>
        
        <div class="tone-content">
          <div class="text-section">
            <h4>메인 문구</h4>
            <p class="main-text">{{ tone.main_text }}</p>
          </div>
          
          <div class="text-section">
            <h4>부모님 인사</h4>
            <p>{{ tone.parents_greeting }}</p>
          </div>
          
          <div class="text-section">
            <h4>예식 정보</h4>
            <p class="wedding-info">{{ tone.wedding_info }}</p>
          </div>
          
          <div class="text-section">
            <h4>마무리 문구</h4>
            <p>{{ tone.closing }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>📝 아직 생성된 톤이 없습니다.</p>
    </div>

    <div class="actions">
      <button class="regenerate-btn" @click="handleRegenerate" :disabled="loading">
        🔄 다시 생성하기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ToneOption } from '@/services/invitationService'

interface Props {
  tones: ToneOption[]
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [tone: ToneOption]
  regenerate: []
}>()

const selectedTone = ref<ToneOption | null>(null)

const selectTone = (tone: ToneOption) => {
  selectedTone.value = tone
  emit('select', tone)
}

const handleRegenerate = () => {
  selectedTone.value = null
  emit('regenerate')
}
</script>

<style scoped>
.tone-selector {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #6c757d;
  margin-bottom: 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.tone-card {
  background: white;
  border: 3px solid #e9ecef;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tone-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.tone-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.tone-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e9ecef;
  position: relative;
}

.tone-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
}

.tone-header h3 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.check-mark {
  font-size: 1.5rem;
  color: #28a745;
  animation: scaleIn 0.3s;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.tone-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.text-section {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.text-section h4 {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  font-weight: 600;
}

.text-section p {
  margin: 0;
  color: #495057;
  line-height: 1.6;
  white-space: pre-line;
}

.main-text {
  font-size: 1.05rem;
  font-weight: 500;
  color: #2c3e50;
}

.wedding-info {
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-size: 1.1rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.regenerate-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: #6c757d;
  color: white;
}

.regenerate-btn:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-2px);
}

.regenerate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .tones-grid {
    grid-template-columns: 1fr;
  }
}
</style>
