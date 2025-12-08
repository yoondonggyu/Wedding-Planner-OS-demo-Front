<template>
  <div class="design-modifier">
    <div class="pro-service-badge">
      <span class="badge-icon">✨</span>
      <span class="badge-text">Gemini 3 Pro Image Preview 유료 서비스</span>
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

    <!-- 모델 선택 -->
    <div class="model-selection-section">
      <h3>AI 모델 선택</h3>
      <p class="section-description">
        이미지 수정에 사용할 AI 모델을 선택해주세요.
      </p>
      <div v-if="loadingModels" class="loading-models">
        모델 목록을 불러오는 중...
      </div>
      <div v-else class="model-cards">
        <div
          v-for="model in availableModels"
          :key="model.id"
          class="model-card"
          :class="{ selected: selectedModel === model.id }"
          @click="selectModel(model.id)"
        >
          <div class="model-card-header">
            <h4>{{ model.name }}</h4>
            <span v-if="model.provider === 'google'" class="premium-badge">유료</span>
            <span v-else class="free-badge">무료</span>
          </div>
          <p class="model-description">{{ model.description }}</p>
          <div class="model-features">
            <span v-if="model.supports_image_to_image" class="feature-tag">이미지→이미지</span>
            <span v-if="model.supports_text_to_image" class="feature-tag">텍스트→이미지</span>
          </div>
        </div>
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
        :disabled="loading || !textRequirements || !selectedModel"
      >
        {{ loading ? '수정 중...' : `✨ ${selectedModelName || '모델 선택'}로 수정하기` }}
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
      <h3>디자인 선택</h3>
      <p class="selection-hint">저장할 디자인을 선택해주세요. 여러 개를 선택하면 둘 다 저장됩니다.</p>
      
      <div class="comparison">
        <div class="image-comparison">
          <!-- 수정 전 이미지 -->
          <div 
            class="comparison-item selectable"
            :class="{ selected: selectedImages.includes('before') }"
            @click="toggleImageSelection('before')"
          >
            <div class="selection-checkbox">
              <input 
                type="checkbox" 
                :checked="selectedImages.includes('before')"
                @click.stop="toggleImageSelection('before')"
              />
            </div>
            <p class="comparison-label">수정 전 (원본)</p>
            <img :src="baseImage" alt="수정 전" />
          </div>
          
          <!-- 수정 후 이미지 -->
          <div 
            class="comparison-item selectable"
            :class="{ selected: selectedImages.includes('after') }"
            @click="toggleImageSelection('after')"
          >
            <div class="selection-checkbox">
              <input 
                type="checkbox" 
                :checked="selectedImages.includes('after')"
                @click.stop="toggleImageSelection('after')"
              />
            </div>
            <p class="comparison-label">수정 후</p>
            <img :src="modifiedImage" alt="수정 후" />
          </div>
        </div>
      </div>
      
      <div class="selection-info" v-if="selectedImages.length > 0">
        <p>
          선택됨: 
          <span v-if="selectedImages.includes('before')">원본</span>
          <span v-if="selectedImages.includes('before') && selectedImages.includes('after')">, </span>
          <span v-if="selectedImages.includes('after')">수정본</span>
        </p>
      </div>
      
      <div class="image-actions">
        <button 
          class="save-btn" 
          @click="handleSave"
          :disabled="selectedImages.length === 0 || saving"
        >
          {{ saving ? '저장 중...' : `💾 선택한 디자인 저장 (${selectedImages.length}개)` }}
        </button>
        <button class="modify-again-btn" @click="handleModifyAgain">
          🔄 다시 수정하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { invitationService } from '@/services/invitationService'

interface Props {
  baseImage: string
  selectedText?: string
  remainingCount?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  modify: [data: { image: string; prompt: string; textRequirements: string; model: string }]
  skip: []
  save: [image: string]
}>()

const textRequirements = ref('')
const loading = ref(false)
const saving = ref(false)
const referenceImagePreview = ref('')
const referenceImageB64 = ref('')
const modifiedImage = ref('')
const referenceFileInput = ref<HTMLInputElement>()

// 이미지 선택 관련
const selectedImages = ref<string[]>(['after']) // 기본값: 수정 후 이미지 선택

// 모델 선택 관련
const availableModels = ref<any[]>([])
const selectedModel = ref<string>('')
const loadingModels = ref(false)

// 선택된 모델 이름
const selectedModelName = computed(() => {
  const model = availableModels.value.find(m => m.id === selectedModel.value)
  return model?.name || ''
})

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

// 모델 목록 로드
const loadModels = async () => {
  loadingModels.value = true
  try {
    const response = await invitationService.getAvailableModels()
    // image_to_image 모델만 필터링 (커스텀 단계에서는 이미지 수정만 필요)
    const imageToImageModels = response.data?.image_to_image || []
    const premiumModels = response.data?.premium || []
    
    // 모든 사용 가능한 모델 합치기 (중복 제거)
    const allModels = [...imageToImageModels, ...premiumModels]
    const uniqueModels = allModels.filter((model, index, self) => 
      index === self.findIndex(m => m.id === model.id)
    )
    
    availableModels.value = uniqueModels
    
    // 기본 모델 선택 (flux가 있으면 flux, 없으면 첫 번째 모델)
    if (uniqueModels.length > 0) {
      const defaultModel = uniqueModels.find(m => m.id === 'flux') || uniqueModels[0]
      selectedModel.value = defaultModel.id
    }
  } catch (error) {
    console.error('모델 목록 로드 실패:', error)
    // 기본 모델 목록 제공
    availableModels.value = [
      {
        id: 'flux',
        name: 'FLUX.2-dev',
        provider: 'fal-ai',
        description: '이미지→이미지 변환 지원',
        supports_image_to_image: true
      },
      {
        id: 'gemini',
        name: 'Gemini nano banana',
        provider: 'google',
        description: '유료 서비스, 텍스트→이미지 및 이미지→이미지 지원',
        supports_image_to_image: true,
        supports_text_to_image: true
      }
    ]
    selectedModel.value = 'flux'
  } finally {
    loadingModels.value = false
  }
}

const selectModel = (modelId: string) => {
  selectedModel.value = modelId
}

const handleModify = () => {
  if (!textRequirements.value) {
    alert('수정 요구사항을 입력해주세요.')
    return
  }

  if (!selectedModel.value) {
    alert('AI 모델을 선택해주세요.')
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
    textRequirements: textRequirements.value,
    model: selectedModel.value
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

// 이미지 선택 토글
const toggleImageSelection = (type: string) => {
  const index = selectedImages.value.indexOf(type)
  if (index > -1) {
    // 이미 선택되어 있으면 제거 (단, 최소 1개는 선택되어야 함)
    if (selectedImages.value.length > 1) {
      selectedImages.value.splice(index, 1)
    }
  } else {
    // 선택되어 있지 않으면 추가
    selectedImages.value.push(type)
  }
}

const handleSave = async () => {
  if (selectedImages.value.length === 0) {
    alert('저장할 이미지를 선택해주세요.')
    return
  }
  
  saving.value = true
  
  try {
    // 선택된 이미지 결정
    let imageToSave: string
    
    if (selectedImages.value.length === 2) {
      // 둘 다 선택된 경우: 수정 후 이미지 우선 (또는 원하면 둘 다 저장 로직 추가 가능)
      imageToSave = modifiedImage.value
    } else if (selectedImages.value.includes('after')) {
      // 수정 후 이미지만 선택
      imageToSave = modifiedImage.value
    } else {
      // 원본 이미지만 선택
      imageToSave = props.baseImage
    }
    
    emit('save', imageToSave)
  } catch (error) {
    console.error('저장 실패:', error)
    alert('저장에 실패했습니다. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

const handleModifyAgain = () => {
  modifiedImage.value = ''
  textRequirements.value = ''
  referenceImageB64.value = ''
  referenceImagePreview.value = ''
  selectedImages.value = ['after'] // 기본값으로 리셋
}

// 컴포넌트 마운트 시 모델 목록 로드
onMounted(() => {
  loadModels()
})

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

.model-selection-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.model-selection-section h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #495057;
}

.loading-models {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.model-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.model-card {
  padding: 1.5rem;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.model-card:hover {
  border-color: #f5576c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.model-card.selected {
  border-color: #f5576c;
  background: #fff5f7;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
}

.model-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.model-card-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.premium-badge {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.free-badge {
  background: #28a745;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.model-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.model-features {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.feature-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
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
  transition: all 0.3s;
}

/* 선택 가능한 이미지 스타일 */
.comparison-item.selectable {
  position: relative;
  cursor: pointer;
  padding: 1rem;
  border: 3px solid transparent;
  border-radius: 16px;
  transition: all 0.3s;
  background: white;
}

.comparison-item.selectable:hover {
  border-color: #dee2e6;
  transform: translateY(-2px);
}

.comparison-item.selectable.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.comparison-item.selectable.selected img {
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
}

.selection-checkbox {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
}

.selection-checkbox input[type="checkbox"] {
  width: 24px;
  height: 24px;
  cursor: pointer;
  accent-color: #667eea;
}

.selection-hint {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  text-align: center;
}

.selection-info {
  text-align: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 8px;
  margin-top: 1rem;
}

.selection-info p {
  margin: 0;
  font-weight: 600;
  color: #667eea;
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
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modify-again-btn {
  background: #6c757d;
  color: white;
}

.modify-again-btn:hover {
  background: #5a6268;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .design-modifier {
    padding: 1rem;
  }
  
  .pro-service-badge {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
    font-size: 0.95rem;
  }
  
  .badge-text {
    font-size: 0.9rem;
  }
  
  .image-comparison {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .comparison-item.selectable {
    padding: 0.75rem;
  }
  
  .selection-checkbox {
    top: 1rem;
    right: 1rem;
  }
  
  .selection-checkbox input[type="checkbox"] {
    width: 28px;
    height: 28px;
  }
  
  .model-cards {
    grid-template-columns: 1fr;
  }
  
  .actions,
  .image-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .modify-btn,
  .skip-btn,
  .save-btn,
  .modify-again-btn {
    width: 100%;
    min-width: auto;
    padding: 1rem;
  }
  
  .current-design,
  .model-selection-section,
  .modify-section,
  .modified-section {
    padding: 1rem;
  }
  
  .current-image img,
  .image-preview img {
    max-width: 100%;
  }
}

/* 작은 모바일 화면 */
@media (max-width: 480px) {
  .design-modifier {
    padding: 0.5rem;
  }
  
  .pro-service-badge {
    padding: 0.75rem;
    font-size: 0.85rem;
  }
  
  .remaining-count {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
  }
  
  .model-card {
    padding: 1rem;
  }
  
  .model-card-header h4 {
    font-size: 1rem;
  }
  
  .requirements-input {
    font-size: 16px; /* iOS 확대 방지 */
  }
}
</style>

