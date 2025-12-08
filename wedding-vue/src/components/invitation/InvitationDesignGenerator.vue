<template>
  <div class="design-generator">
    <!-- 선택된 톤 정보 표시 -->
    <div class="selected-tone-info">
      <h3>선택한 톤: {{ selectedToneDescription }}</h3>
      <div class="tone-text-preview">
        <p class="preview-label">선택한 문구:</p>
        <p class="preview-text">{{ selectedText }}</p>
      </div>
    </div>

    <!-- 디자인 요구사항 입력 -->
    <div class="requirements-section">
      <h3>디자인 요구사항 입력</h3>
      <p class="section-description">
        원하는 청첩장 디자인을 텍스트로 설명해주세요. 예시를 참고하여 작성하시면 더 정확한 디자인을 생성할 수 있습니다.
      </p>
      
      <!-- 예시 제공 -->
      <div class="examples-section">
        <h4>💡 예시</h4>
        <div class="examples">
          <div class="example-item" @click="useExample(example)" v-for="example in examples" :key="example">
            <p>{{ example }}</p>
            <button class="use-example-btn">사용하기</button>
          </div>
        </div>
      </div>

      <textarea
        v-model="requirements"
        rows="6"
        placeholder="예: 부드러운 핑크와 골드 색상의 우아한 디자인, 로맨틱한 분위기, 미니멀한 레이아웃, 꽃 장식 포함"
        class="requirements-input"
      ></textarea>
      <p class="hint">한국어로 자세히 설명해주세요. AI가 영어 프롬프트로 변환합니다.</p>
    </div>

    <!-- 모델 선택 (무료만) -->
    <div class="model-selection">
      <h3>생성 모델 선택</h3>
      <div class="model-options">
        <label class="model-option" :class="{ selected: modelType === 'sd15' }">
          <input type="radio" v-model="modelType" value="sd15" />
          <div class="option-content">
            <span class="option-title">SD 1.5 (Stable Diffusion 1.5)</span>
            <span class="option-desc">텍스트만 입력하여 생성 (무료)</span>
          </div>
        </label>
        <label class="model-option" :class="{ selected: modelType === 'flux' }">
          <input type="radio" v-model="modelType" value="flux" />
          <div class="option-content">
            <span class="option-title">FLUX.2-dev</span>
            <span class="option-desc">텍스트 또는 이미지+텍스트로 생성 (무료)</span>
          </div>
        </label>
      </div>
    </div>

    <!-- 기본 이미지 업로드 (FLUX만) -->
    <div v-if="modelType === 'flux'" class="base-image-section">
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

    <!-- 생성 버튼 -->
    <div class="actions">
      <button
        class="generate-btn"
        @click="handleGenerate"
        :disabled="loading || !requirements"
      >
        {{ loading ? '생성 중...' : '🎨 1차 디자인 생성 (무료)' }}
      </button>
    </div>

    <!-- 생성된 이미지 -->
    <div v-if="generatedImage" class="generated-section">
      <h3>생성된 디자인</h3>
      <div class="generated-image">
        <img :src="generatedImage" alt="생성된 청첩장" />
      </div>
      
      <div class="image-actions">
        <button class="next-btn" @click="handleNext">
          ✨ 다음 단계: 디자인 수정 (Gemini 3.0 Pro)
        </button>
        <button class="regenerate-btn" @click="handleRegenerate">
          🔄 다시 생성하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { InvitationBasicInfo } from '@/services/invitationService'

interface Props {
  selectedText: string
  selectedTone: string
  basicInfo?: InvitationBasicInfo
}

const props = defineProps<Props>()

const emit = defineEmits<{
  generate: [data: { image: string; prompt: string; requirements: string }]
  next: []
}>()

const requirements = ref('')
const modelType = ref<'sd15' | 'flux'>('sd15')
const useBaseImage = ref(false)
const loading = ref(false)
const baseImagePreview = ref('')
const baseImageB64 = ref('')
const generatedImage = ref('')
const fileInput = ref<HTMLInputElement>()

const examples = [
  '부드러운 핑크와 골드 색상의 우아한 디자인, 로맨틱한 분위기, 미니멀한 레이아웃, 꽃 장식 포함',
  '클래식하고 격식 있는 디자인, 흰색과 금색 조합, 전통적인 패턴, 우아한 타이포그래피',
  '모던하고 세련된 디자인, 파스텔 톤 색상, 깔끔한 레이아웃, 기하학적 패턴',
  '자연스럽고 따뜻한 디자인, 베이지와 브라운 톤, 나뭇잎과 꽃 장식, 친근한 느낌',
  '럭셔리하고 화려한 디자인, 진한 보라색과 골드, 장식적인 요소, 고급스러운 느낌'
]

const selectedToneDescription = computed(() => {
  const toneMap: Record<string, string> = {
    'affectionate': '다정한',
    'cheerful': '밝고 명랑한',
    'polite': '예의 있는',
    'formal': '격식 있는',
    'emotional': '감성적인'
  }
  return toneMap[props.selectedTone] || props.selectedTone
})

const useExample = (example: string) => {
  requirements.value = example
}

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
  if (!requirements.value) {
    alert('디자인 요구사항을 입력해주세요.')
    return
  }

  // 한국어 요구사항을 영어 프롬프트로 변환 (간단한 변환, 실제로는 AI를 사용할 수 있음)
  const prompt = convertToEnglishPrompt(requirements.value)

  emit('generate', {
    image: baseImageB64.value,
    prompt: prompt,
    requirements: requirements.value
  })
}

const convertToEnglishPrompt = (koreanText: string): string => {
  // 간단한 변환 로직 (실제로는 Gemini API를 사용하여 더 정확하게 변환 가능)
  const translations: Record<string, string> = {
    '부드러운': 'soft',
    '핑크': 'pink',
    '골드': 'gold',
    '우아한': 'elegant',
    '로맨틱한': 'romantic',
    '미니멀한': 'minimalist',
    '클래식한': 'classic',
    '격식 있는': 'formal',
    '모던한': 'modern',
    '세련된': 'sophisticated',
    '자연스러운': 'natural',
    '따뜻한': 'warm',
    '럭셔리한': 'luxury',
    '화려한': 'lavish',
    '꽃': 'flowers',
    '장식': 'decoration',
    '디자인': 'design',
    '레이아웃': 'layout',
    '색상': 'color',
    '톤': 'tone'
  }

  let prompt = koreanText
  for (const [ko, en] of Object.entries(translations)) {
    prompt = prompt.replace(new RegExp(ko, 'g'), en)
  }

  // 기본 프롬프트 구조
  return `Elegant wedding invitation card, ${prompt}, high quality, professional design, beautiful typography, wedding theme`
}

const handleNext = () => {
  if (!generatedImage.value) {
    alert('먼저 디자인을 생성해주세요.')
    return
  }
  emit('next')
}

const handleRegenerate = () => {
  generatedImage.value = ''
  baseImageB64.value = ''
  baseImagePreview.value = ''
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
.design-generator {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.selected-tone-info {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 2px solid #667eea;
}

.selected-tone-info h3 {
  margin: 0 0 1rem 0;
  color: #667eea;
  font-size: 1.2rem;
}

.tone-text-preview {
  background: white;
  padding: 1rem;
  border-radius: 8px;
}

.preview-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.preview-text {
  color: #495057;
  line-height: 1.6;
  white-space: pre-line;
  margin: 0;
}

.requirements-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.requirements-section h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #495057;
}

.section-description {
  color: #6c757d;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.examples-section {
  margin-bottom: 1.5rem;
}

.examples-section h4 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  color: #495057;
}

.examples {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.example-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #dee2e6;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.example-item:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.example-item p {
  margin: 0;
  color: #495057;
  flex: 1;
  font-size: 0.9rem;
}

.use-example-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 600;
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
  border-color: #667eea;
}

.hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.model-selection,
.base-image-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.model-selection h3 {
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
  margin-top: 1.5rem;
}

.generate-btn {
  padding: 1rem 2.5rem;
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

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.generated-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.generated-section h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #495057;
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

.image-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.next-btn,
.regenerate-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.next-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.6);
}

.regenerate-btn {
  background: #6c757d;
  color: white;
}

.regenerate-btn:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .model-options {
    grid-template-columns: 1fr;
  }
  
  .image-actions {
    flex-direction: column;
  }
}
</style>

