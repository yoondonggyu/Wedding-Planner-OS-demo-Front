<template>
  <div class="design-modifier">
    <div class="pro-service-badge">
      <span class="badge-icon">✨</span>
      <span class="badge-text">Gemini 3.0 Pro 유료 서비스</span>
      <span v-if="remainingCount !== undefined" class="remaining-count">
        남은 횟수: {{ remainingCount }}회
      </span>
    </div>

    <!-- 현재 디자인 표시 -->
    <div v-if="baseImage" class="current-design">
      <h3>현재 디자인</h3>
      <div class="current-image">
        <img :src="baseImage" alt="현재 디자인" />
      </div>
    </div>

    <!-- 수정 요구사항 입력 -->
    <div class="modify-section">
      <h3>디자인 수정 요구사항</h3>
      <p class="section-description">
        텍스트와 이미지를 사용하여 디자인을 더 정교하게 수정할 수 있습니다.<br>
        원하는 수정 사항을 자세히 설명해주세요.
      </p>

      <!-- 텍스트 요구사항 -->
      <div class="text-requirements">
        <label for="text-requirements">텍스트 요구사항 *</label>
        <textarea
          id="text-requirements"
          v-model="textRequirements"
          rows="4"
          placeholder="예: 색상을 더 밝게, 꽃 장식을 추가, 레이아웃을 더 넓게, 폰트를 더 우아하게"
          class="requirements-input"
        ></textarea>
        <p class="hint">한국어로 자세히 설명해주세요.</p>
      </div>

      <!-- 이미지 참고 (선택사항) -->
      <div class="reference-image-section">
        <h4>참고 이미지 업로드 (선택사항)</h4>
        <p class="sub-hint">원하는 스타일의 참고 이미지를 업로드하면 더 정확한 수정이 가능합니다.</p>
        <div class="image-upload">
          <input
            type="file"
            accept="image/*"
            @change="handleReferenceImageUpload"
            ref="referenceFileInput"
          />
          <div v-if="referenceImagePreview" class="image-preview">
            <img :src="referenceImagePreview" alt="참고 이미지" />
            <button @click="clearReferenceImage" class="clear-btn">× 삭제</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 수정 버튼 -->
    <div class="actions">
      <button
        class="modify-btn"
        @click="handleModify"
        :disabled="loading || !textRequirements"
      >
        {{ loading ? '수정 중...' : '✨ Gemini 3.0 Pro로 수정하기' }}
      </button>
      <button
        class="skip-btn"
        @click="handleSkip"
      >
        건너뛰기
      </button>
    </div>

    <!-- 수정된 이미지 -->
    <div v-if="modifiedImage" class="modified-section">
      <h3>수정된 디자인</h3>
      <div class="comparison">
        <div class="image-comparison">
          <div class="comparison-item">
            <p class="comparison-label">수정 전</p>
            <img :src="baseImage" alt="수정 전" />
          </div>
          <div class="comparison-item">
            <p class="comparison-label">수정 후</p>
            <img :src="modifiedImage" alt="수정 후" />
          </div>
        </div>
      </div>
      
      <div class="image-actions">
        <button class="save-btn" @click="handleSave">
          💾 저장하고 완료
        </button>
        <button class="modify-again-btn" @click="handleModifyAgain">
          🔄 다시 수정하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  baseImage: string
  selectedText?: string
  remainingCount?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  modify: [data: { image: string; prompt: string; textRequirements: string }]
  skip: []
  save: [image: string]
}>()

const textRequirements = ref('')
const loading = ref(false)
const referenceImagePreview = ref('')
const referenceImageB64 = ref('')
const modifiedImage = ref('')
const referenceFileInput = ref<HTMLInputElement>()

const handleReferenceImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    referenceImagePreview.value = e.target?.result as string
    referenceImageB64.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearReferenceImage = () => {
  referenceImagePreview.value = ''
  referenceImageB64.value = ''
  if (referenceFileInput.value) {
    referenceFileInput.value.value = ''
  }
}

const handleModify = () => {
  if (!textRequirements.value) {
    alert('수정 요구사항을 입력해주세요.')
    return
  }

  // 남은 횟수 확인
  if (props.remainingCount !== undefined && props.remainingCount <= 0) {
    alert('하루 사용 횟수(5회)를 모두 사용하셨습니다. 내일 다시 시도해주세요.')
    return
  }

  // 한국어 요구사항을 영어 프롬프트로 변환
  const prompt = convertToEnglishPrompt(textRequirements.value)

  emit('modify', {
    image: props.baseImage,
    prompt: prompt,
    textRequirements: textRequirements.value
  })
}

const convertToEnglishPrompt = (koreanText: string): string => {
  // 간단한 변환 로직
  const translations: Record<string, string> = {
    '더 밝게': 'brighter',
    '더 어둡게': 'darker',
    '추가': 'add',
    '제거': 'remove',
    '변경': 'change',
    '색상': 'color',
    '꽃': 'flowers',
    '장식': 'decoration',
    '레이아웃': 'layout',
    '폰트': 'font',
    '우아하게': 'elegant',
    '넓게': 'wider',
    '좁게': 'narrower'
  }

  let prompt = koreanText
  for (const [ko, en] of Object.entries(translations)) {
    prompt = prompt.replace(new RegExp(ko, 'g'), en)
  }

  return `Modify the wedding invitation design: ${prompt}, maintain the overall style, high quality, professional design`
}

const handleSkip = () => {
  emit('skip')
}

const handleSave = () => {
  const imageToSave = modifiedImage.value || props.baseImage
  emit('save', imageToSave)
}

const handleModifyAgain = () => {
  modifiedImage.value = ''
  textRequirements.value = ''
  referenceImageB64.value = ''
  referenceImagePreview.value = ''
}

// 부모로부터 수정된 이미지 받기
defineExpose({
  setGeneratedImage: (image: string) => {
    modifiedImage.value = image
  },
  setLoading: (value: boolean) => {
    loading.value = value
  }
})
</script>

<style scoped>
.design-modifier {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.pro-service-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
  flex-wrap: wrap;
}

.remaining-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.badge-icon {
  font-size: 1.5rem;
}

.current-design {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.current-design h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #495057;
}

.current-image {
  text-align: center;
}

.current-image img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modify-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.modify-section h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #495057;
}

.section-description {
  color: #6c757d;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
}

.text-requirements {
  margin-bottom: 1.5rem;
}

.text-requirements label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
}

.requirements-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.requirements-input:focus {
  outline: none;
  border-color: #f5576c;
}

.hint,
.sub-hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.reference-image-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #dee2e6;
}

.reference-image-section h4 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #495057;
}

.image-upload input[type="file"] {
  display: block;
  margin-bottom: 1rem;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.clear-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 1.2rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.modify-btn,
.skip-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.modify-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.modify-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.6);
}

.modify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.skip-btn {
  background: #6c757d;
  color: white;
}

.skip-btn:hover {
  background: #5a6268;
}

.modified-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.modified-section h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #495057;
}

.comparison {
  margin: 1rem 0;
}

.image-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.comparison-item {
  text-align: center;
}

.comparison-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
}

.comparison-item img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.save-btn,
.modify-again-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.modify-again-btn {
  background: #6c757d;
  color: white;
}

.modify-again-btn:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .image-comparison {
    grid-template-columns: 1fr;
  }
  
  .actions,
  .image-actions {
    flex-direction: column;
  }
}
</style>

