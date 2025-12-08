<template>
  <div class="requirements-form">
    <div class="form-header">
      <h2>청첩장 만들 때 추가 요구사항 입력</h2>
      <p class="description">
        아래 기본 정보는 이미 입력하신 내용입니다.<br>
        추가로 청첩장에 넣고 싶은 문구나 특별한 요청사항을 입력해주세요.
      </p>
    </div>

    <!-- 기본 정보 표시 -->
    <div class="basic-info-section">
      <h3>📋 입력하신 기본 정보</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">신랑 이름:</span>
          <span class="info-value">{{ basicInfo?.groom_name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">신부 이름:</span>
          <span class="info-value">{{ basicInfo?.bride_name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">예식일:</span>
          <span class="info-value">{{ basicInfo?.wedding_date || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">예식 시간:</span>
          <span class="info-value">{{ basicInfo?.wedding_time || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">예식 장소:</span>
          <span class="info-value">{{ basicInfo?.wedding_location || '-' }}</span>
        </div>
        <div v-if="basicInfo?.groom_father_name || basicInfo?.groom_mother_name" class="info-item">
          <span class="info-label">신랑 부모님:</span>
          <span class="info-value">
            {{ [basicInfo?.groom_father_name, basicInfo?.groom_mother_name].filter(Boolean).join(' · ') || '-' }}
          </span>
        </div>
        <div v-if="basicInfo?.bride_father_name || basicInfo?.bride_mother_name" class="info-item">
          <span class="info-label">신부 부모님:</span>
          <span class="info-value">
            {{ [basicInfo?.bride_father_name, basicInfo?.bride_mother_name].filter(Boolean).join(' · ') || '-' }}
          </span>
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-section">
        <label for="requirements">추가 요구사항 입력 (선택사항)</label>
        <textarea
          id="requirements"
          v-model="requirements"
          rows="6"
          placeholder="예: 특별한 인사말, 원하는 문구 스타일, 특별한 요청사항 등을 입력해주세요.&#10;&#10;예시:&#10;- '따뜻하고 친근한 느낌의 문구로 작성해주세요'&#10;- '특별한 인사말: 오랜 친구들에게 감사 인사'&#10;- '로맨틱하고 우아한 분위기'"
          class="requirements-input"
        ></textarea>
        <p class="hint">
          <strong>추가로 입력 가능한 내용:</strong><br>
          • 원하는 문구 스타일이나 분위기 (예: 따뜻한, 우아한, 친근한 등)<br>
          • 특별한 인사말이나 메시지<br>
          • 특별한 요청사항이나 주의사항<br>
          비워두셔도 기본 정보를 바탕으로 AI가 자동으로 멘트를 생성합니다.
        </p>
      </div>

      <div class="form-actions">
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '톤 생성 중...' : '다음: 톤 제안 받기' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { InvitationBasicInfo } from '@/services/invitationService'

interface Props {
  basicInfo?: InvitationBasicInfo
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [requirements: string]
}>()

const requirements = ref('')
const loading = ref(false)

const handleSubmit = () => {
  // 추가 요구사항이 없어도 진행 가능 (선택사항)
  emit('submit', requirements.value || '')
}
</script>

<style scoped>
.requirements-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.description {
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.6;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
  font-size: 1rem;
}

.requirements-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

.requirements-input:focus {
  outline: none;
  border-color: #667eea;
}

.hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.6;
}

.basic-info-section {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.basic-info-section h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.submit-btn {
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>



