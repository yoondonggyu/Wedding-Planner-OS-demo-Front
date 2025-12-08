<template>
  <div class="requirements-form">
    <div class="form-header">
      <h2>청첩장 만들 때 요구사항 입력</h2>
      <p class="description">
        원하는 청첩장의 스타일이나 분위기를 텍스트로 입력해주세요.<br>
        이 정보를 바탕으로 AI가 5가지 톤의 멘트를 자동으로 제안합니다.
      </p>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-section">
        <label for="requirements">요구사항 입력 *</label>
        <textarea
          id="requirements"
          v-model="requirements"
          rows="6"
          placeholder="예: 로맨틱하고 우아한 분위기, 클래식한 스타일, 따뜻하고 친근한 느낌 등"
          required
          class="requirements-input"
        ></textarea>
        <p class="hint">한국어로 자세히 설명해주세요. AI가 이를 바탕으로 다양한 톤의 멘트를 생성합니다.</p>
      </div>

      <div class="form-actions">
        <button type="submit" class="submit-btn" :disabled="loading || !requirements">
          {{ loading ? '톤 생성 중...' : '다음: 톤 제안 받기' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  submit: [requirements: string]
}>()

const requirements = ref('')
const loading = ref(false)

const handleSubmit = () => {
  if (!requirements.value.trim()) {
    alert('요구사항을 입력해주세요.')
    return
  }
  
  emit('submit', requirements.value)
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



