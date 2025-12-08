<template>
  <div class="image-generator">
    <h2>청첩장 이미지 생성</h2>
    <p class="subtitle">AI가 청첩장 디자인을 만들어드립니다</p>

    <!-- 모델 선택 -->
    <div class="model-selection">
      <h3>모델 선택</h3>
      <div class="model-options">
        <label class="model-option" :class="{ selected: modelType === 'free' }">
          <input type="radio" v-model="modelType" value="free" />
          <div class="option-content">
            <span class="option-title">무료 모델</span>
            <span class="option-desc">SD 1.5 / FLUX (텍스트만 / 텍스트+이미지)</span>
          </div>
        </label>
        <label class="model-option" :class="{ selected: modelType === 'pro' }">
          <input type="radio" v-model="modelType" value="pro" />
          <div class="option-content">
            <span class="option-title">프로 모델 (미구현)</span>
            <span class="option-desc">Gemini 3.0 Pro (텍스트+이미지)</span>
          </div>
        </label>
      </div>
    </div>

    <!-- 프롬프트 입력 -->
    <div class="prompt-section">
      <h3>이미지 설명 (영어로 입력)</h3>
      <textarea
        v-model="prompt"
        rows="4"
        placeholder="예: Elegant wedding invitation card with soft pink flowers, romantic atmosphere, gold accents, minimalist design"
        class="prompt-input"
      ></textarea>
      <p class="hint">💡 꽃, 색상, 스타일 등을 영어로 자세히 설명해주세요</p>
    </div>

    <!-- 기본 이미지 업로드 (유료 모델 또는 FLUX) -->
    <div v-if="modelType === 'pro' || useBaseImage" class="base-image-section">
      <h3>기본 이미지 업로드 (선택사항)</h3>
      <div class="image-upload">
        <input
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          ref="fileInput"
        />
        <div v-if="baseImagePreview" class="image-preview">
          <img :src="baseImagePreview" alt="미리보기" />
          <button @click="clearImage" class="clear-btn">× 삭제</button>
        </div>
      </div>
    </div>

    <!-- 이미지 타입 선택 (무료 모델) -->
    <div v-if="modelType === 'free'" class="image-type-section">
      <label>
        <input type="checkbox" v-model="useBaseImage" />
        이미지 기반 생성 사용 (FLUX)
      </label>
    </div>

    <!-- 생성 버튼 -->
    <div class="actions">
      <button
        class="generate-btn"
        @click="handleGenerate"
        :disabled="loading || !prompt"
      >
        {{ loading ? '생성 중...' : '🎨 이미지 생성' }}
      </button>
    </div>

    <!-- 생성된 이미지 -->
    <div v-if="generatedImage" class="generated-section">
      <h3>생성된 이미지</h3>
      <div class="generated-image">
        <img :src="generatedImage" alt="생성된 청첩장" />
      </div>
      
      <!-- 수정 섹션 -->
      <div class="modify-section">
        <h4>이미지 수정</h4>
        <textarea
          v-model="modifyPrompt"
          rows="2"
          placeholder="수정 내용을 영어로 입력 (예: Make it more colorful, Add more flowers)"
          class="modify-input"
        ></textarea>
        <button
          class="modify-btn"
          @click="handleModify"
          :disabled="loading || !modifyPrompt"
        >
          {{ loading ? '수정 중...' : '✏️ 이미지 수정' }}
        </button>
      </div>

      <div class="image-actions">
        <button class="save-btn" @click="handleSave">
          💾 저장하고 다음
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  selectedText: string
  selectedTone: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  generate: [data: { image: string; prompt: string; modelType: string }]
  modify: [data: { image: string; prompt: string }]
  save: [image: string]
}>()

const modelType = ref<'free' | 'pro'>('free')
const useBaseImage = ref(false)
const prompt = ref('')
const modifyPrompt = ref('')
const loading = ref(false)
const baseImagePreview = ref('')
const baseImageB64 = ref('')
const generatedImage = ref('')
const fileInput = ref<HTMLInputElement>()

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    baseImagePreview.value = e.target?.result as string
    baseImageB64.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  baseImagePreview.value = ''
  baseImageB64.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleGenerate = () => {
  if (!prompt.value) {
    alert('프롬프트를 입력해주세요.')
    return
  }

  emit('generate', {
    image: baseImageB64.value,
    prompt: prompt.value,
    modelType: modelType.value
  })
}

const handleModify = () => {
  if (!modifyPrompt.value) {
    alert('수정 내용을 입력해주세요.')
    return
  }

  emit('modify', {
    image: generatedImage.value,
    prompt: modifyPrompt.value
  })
}

const handleSave = () => {
  if (!generatedImage.value) {
    alert('생성된 이미지가 없습니다.')
    return
  }

  emit('save', generatedImage.value)
}

// 부모로부터 생성된 이미지 받기
defineExpose({
  setGeneratedImage: (image: string) => {
    generatedImage.value = image
  },
  setLoading: (value: boolean) => {
    loading.value = value
  }
})
</script>

<style scoped>
.image-generator {
  max-width: 900px;
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

.model-selection,
.prompt-section,
.base-image-section,
.image-type-section,
.generated-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #495057;
}

.model-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.model-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.model-option:hover {
  border-color: #667eea;
}

.model-option.selected {
  border-color: #667eea;
  background: #f0f2ff;
}

.model-option input[type="radio"] {
  margin-right: 1rem;
}

.option-content {
  display: flex;
  flex-direction: column;
}

.option-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.option-desc {
  font-size: 0.85rem;
  color: #6c757d;
}

.prompt-input,
.modify-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.prompt-input:focus,
.modify-input:focus {
  outline: none;
  border-color: #667eea;
}

.hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
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

.actions,
.image-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.generate-btn,
.modify-btn,
.save-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.generate-btn,
.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.generate-btn:hover:not(:disabled),
.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.generate-btn:disabled,
.modify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modify-btn {
  background: #28a745;
  color: white;
}

.modify-btn:hover:not(:disabled) {
  background: #218838;
}

.generated-image {
  text-align: center;
  margin: 1rem 0;
}

.generated-image img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modify-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #dee2e6;
}

.modify-section h4 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: #495057;
}

@media (max-width: 768px) {
  .model-options {
    grid-template-columns: 1fr;
  }
}
</style>
