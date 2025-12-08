<template>
  <div class="design-step">
    <!-- AI 모델 선택 섹션 -->
    <div class="model-selection-section">
      <h3>🎨 AI 모델 선택</h3>
      <p class="section-description">
        이미지 생성에 사용할 AI 모델을 선택해주세요.
      </p>
      
      <div class="model-cards">
        <!-- Gemini 3 Pro Image Preview (활성화) -->
        <div class="model-card active" @click="selectModel('gemini')">
          <div class="model-card-header">
            <h4>Gemini 3 Pro Image Preview</h4>
            <span class="premium-badge">유료</span>
          </div>
          <p class="model-description">Google의 최신 Gemini 모델로 고품질 이미지 생성</p>
          <div class="model-status">
            <span class="status-badge active">사용 가능</span>
          </div>
        </div>
        
        <!-- Hugging Face 모델들 (비활성화 - UI만 표시) -->
        <div 
          class="model-card disabled" 
          :class="{ 'selected-disabled': selectedModel === 'flux' }"
          @click="selectModel('flux')"
        >
          <div class="model-card-header">
            <h4>FLUX.2-dev</h4>
            <span class="free-badge">무료</span>
          </div>
          <p class="model-description">Hugging Face의 최신 FLUX 모델</p>
          <div class="model-status">
            <span class="status-badge disabled">결제 후 사용 가능</span>
          </div>
        </div>
        
        <div 
          class="model-card disabled"
          :class="{ 'selected-disabled': selectedModel === 'flux-schnell' }"
          @click="selectModel('flux-schnell')"
        >
          <div class="model-card-header">
            <h4>FLUX.1-schnell</h4>
            <span class="free-badge">무료</span>
          </div>
          <p class="model-description">빠른 생성 속도의 FLUX 모델</p>
          <div class="model-status">
            <span class="status-badge disabled">결제 후 사용 가능</span>
          </div>
        </div>
        
        <div 
          class="model-card disabled"
          :class="{ 'selected-disabled': selectedModel === 'sdxl' }"
          @click="selectModel('sdxl')"
        >
          <div class="model-card-header">
            <h4>Stable Diffusion XL</h4>
            <span class="free-badge">무료</span>
          </div>
          <p class="model-description">고품질 이미지 생성 모델</p>
          <div class="model-status">
            <span class="status-badge disabled">결제 후 사용 가능</span>
          </div>
        </div>
        
        <div 
          class="model-card disabled"
          :class="{ 'selected-disabled': selectedModel === 'sd15' }"
          @click="selectModel('sd15')"
        >
          <div class="model-card-header">
            <h4>Stable Diffusion 1.5</h4>
            <span class="free-badge">무료</span>
          </div>
          <p class="model-description">클래식 이미지 생성 모델</p>
          <div class="model-status">
            <span class="status-badge disabled">결제 후 사용 가능</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 스타일 선택 -->
    <div class="style-selection">
      <h3>원하는 스타일 선택</h3>
      <div class="style-options">
        <label
          v-for="style in styles"
          :key="style.value"
          class="style-option"
          :class="{ selected: selectedStyle === style.value }"
        >
          <input type="radio" v-model="selectedStyle" :value="style.value" />
          <div class="style-content">
            <span class="style-icon">{{ style.icon }}</span>
            <span class="style-name">{{ style.name }}</span>
            <span class="style-desc">{{ style.description }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- 추가 요청 입력 -->
    <div v-if="selectedStyle" class="additional-request">
      <h3>추가 요청 (선택사항)</h3>
      <p class="section-description">
        원하는 디자인 변경사항을 텍스트로 입력해주세요.
      </p>
      <textarea
        v-model="additionalRequest"
        rows="4"
        placeholder="예: 색상을 더 밝게, 꽃 장식을 추가, 레이아웃을 더 넓게"
        class="request-input"
      ></textarea>
    </div>

    <!-- 이미지 생성 -->
    <div v-if="selectedStyle" class="generate-section">
      <h3>✨ 이미지 생성</h3>
      <p class="section-description">
        <strong>{{ getModelName(selectedModel) }}</strong> 모델로 청첩장 이미지를 생성합니다.
      </p>

      <button
        class="generate-final-btn"
        @click="generateFinalImage"
        :disabled="loading || !selectedStyle"
      >
        {{ loading ? '생성 중...' : `🎨 ${getModelName(selectedModel)}로 이미지 생성하기` }}
      </button>
    </div>

    <!-- 생성된 최종 이미지 -->
    <div v-if="finalImage" class="final-result">
      <h3>생성된 최종 디자인</h3>
      <div class="final-image">
        <img :src="finalImage" alt="최종 청첩장" />
      </div>
      <div class="result-actions">
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
  generate: [data: { image: string; prompt: string; style: string; additionalRequest: string; model: string }]
}>()

const loading = ref(false)
const draftGenerated = ref(false)
const sd15DraftImage = ref('')
const fluxDraftImage = ref('')
const selectedDraft = ref<'sd15' | 'flux' | ''>('')
const draftImage = ref('')  // 선택된 초안 이미지
const selectedStyle = ref('')
const additionalRequest = ref('')
const modelType = ref<'sd15' | 'flux'>('sd15')
const finalImage = ref('')
const selectedModel = ref('gemini') // 기본값: Gemini 3 Pro Image Preview

const styles = [
  { value: 'CLASSIC', name: '클래식', icon: '🎩', description: '전통적이고 우아한 스타일' },
  { value: 'MODERN', name: '모던', icon: '✨', description: '현대적이고 세련된 스타일' },
  { value: 'VINTAGE', name: '빈티지', icon: '🌹', description: '빈티지하고 로맨틱한 스타일' }
]

// 모델 선택 함수
const selectModel = (modelId: string) => {
  // UI에서는 모든 모델 선택 가능 (버튼 텍스트 변경용)
  // 실제 생성은 gemini만 가능
  selectedModel.value = modelId
}

// 모델명 가져오기 함수
const getModelName = (modelId: string): string => {
  const modelNames: Record<string, string> = {
    'gemini': 'Gemini 3 Pro Image Preview',
    'flux': 'FLUX.2-dev',
    'flux-schnell': 'FLUX.1-schnell',
    'sdxl': 'Stable Diffusion XL',
    'sd15': 'Stable Diffusion 1.5'
  }
  return modelNames[modelId] || 'Gemini 3 Pro Image Preview'
}

// 초안 선택
const selectDraft = (model: 'sd15' | 'flux', image: string) => {
  selectedDraft.value = model
  draftImage.value = image
  modelType.value = model  // 선택한 모델을 최종 이미지 생성에도 사용
}

// 두 모델로 초안 동시 생성
const generateDrafts = async () => {
  loading.value = true
  sd15DraftImage.value = ''
  fluxDraftImage.value = ''
  selectedDraft.value = ''
  draftImage.value = ''
  
  const draftPrompt = `Beautiful wedding invitation card, elegant floral border, soft pastel colors, ${props.selectedTone || 'warm and romantic'} mood, minimalist design, high quality, professional invitation design`
  
  // SD 1.5와 FLUX-Schnell 두 모델을 병렬로 호출
  const generateWithModel = async (model: string): Promise<string | null> => {
    try {
      const response = await fetch('http://localhost:8102/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: draftPrompt,
          model: model
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`${model} 생성 실패:`, errorText)
        return null
      }
      
      const result = await response.json()
      if (result.data && result.data.image_b64) {
        return result.data.image_b64
      }
      return null
    } catch (error) {
      console.error(`${model} 생성 에러:`, error)
      return null
    }
  }
  
  try {
    // 병렬로 두 모델 호출 (sd15, flux-schnell 사용)
    const [sd15Result, fluxResult] = await Promise.all([
      generateWithModel('sd15'),          // Stable Diffusion 1.5 (무료)
      generateWithModel('flux-schnell')   // FLUX.1-schnell (무료, 빠른 생성)
    ])
    
    if (sd15Result) {
      sd15DraftImage.value = sd15Result
    }
    
    if (fluxResult) {
      fluxDraftImage.value = fluxResult
    }
    
    // 적어도 하나가 성공하면 완료
    if (sd15Result || fluxResult) {
      draftGenerated.value = true
      
      // 하나만 성공했으면 자동 선택
      if (sd15Result && !fluxResult) {
        selectDraft('sd15', sd15Result)
      } else if (!sd15Result && fluxResult) {
        selectDraft('flux', fluxResult)
      }
    } else {
      alert('두 모델 모두 초안 생성에 실패했습니다. 다시 시도해주세요.')
    }
  } catch (error) {
    console.error('초안 생성 실패:', error)
    alert('초안 생성에 실패했습니다. 다시 시도해주세요.')
  } finally {
    loading.value = false
  }
}

const generateFinalImage = () => {
  if (!selectedStyle.value) {
    alert('스타일을 선택해주세요.')
    return
  }

  // 프롬프트 생성
  const prompt = generatePrompt()

  // 선택한 모델로 이미지 생성
  emit('generate', {
    image: '', // 초안 이미지 없음
    prompt: prompt,
    style: selectedStyle.value,
    additionalRequest: additionalRequest.value,
    model: selectedModel.value // 선택한 모델 전달
  })
}

const generatePrompt = (): string => {
  let prompt = `Elegant wedding invitation card design, ${selectedStyle.value.toLowerCase()} style`
  
  // 선택한 톤의 문구를 프롬프트에 포함
  if (props.selectedText) {
    prompt += `. The invitation text should be: "${props.selectedText}". Include this text in the design.`
  }
  
  if (props.selectedTone) {
    const toneMap: Record<string, string> = {
      'affectionate': 'warm, tender, loving',
      'cheerful': 'bright, joyful, energetic',
      'polite': 'respectful, courteous, traditional',
      'formal': 'dignified, elegant, ceremonial',
      'emotional': 'touching, heartfelt, sentimental'
    }
    prompt += `, ${toneMap[props.selectedTone] || props.selectedTone} tone`
  }

  if (additionalRequest.value) {
    prompt += `, ${convertToEnglish(additionalRequest.value)}`
  }

  if (props.basicInfo) {
    if (props.basicInfo.groom_name && props.basicInfo.bride_name) {
      prompt += `, for ${props.basicInfo.groom_name} and ${props.basicInfo.bride_name}`
    }
  }

  prompt += ', high quality, professional design, beautiful typography'
  
  return prompt
}

const convertToEnglish = (korean: string): string => {
  const translations: Record<string, string> = {
    '더 밝게': 'brighter',
    '더 어둡게': 'darker',
    '추가': 'add',
    '제거': 'remove',
    '색상': 'color',
    '꽃': 'flowers',
    '장식': 'decoration',
    '레이아웃': 'layout',
    '넓게': 'wider',
    '좁게': 'narrower'
  }

  let result = korean
  for (const [ko, en] of Object.entries(translations)) {
    result = result.replace(new RegExp(ko, 'g'), en)
  }
  return result
}

// handleNext 함수 제거 - 더 이상 사용하지 않음

const handleRegenerate = () => {
  finalImage.value = ''
  selectedStyle.value = ''
  additionalRequest.value = ''
}

// 부모로부터 생성된 이미지 받기
defineExpose({
  setFinalImage: (image: string) => {
    finalImage.value = image
  },
  setLoading: (value: boolean) => {
    loading.value = value
  }
})
</script>

<style scoped>
.design-step {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
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

.model-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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

.model-card.active {
  border-color: #667eea;
  background: #f0f2ff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.model-card.active.selected {
  border-color: #667eea;
  background: #e8ebff;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.model-card.disabled {
  opacity: 0.6;
  cursor: pointer;
  background: #f8f9fa;
  border-color: #dee2e6;
}

.model-card.disabled:hover {
  opacity: 0.8;
  border-color: #adb5bd;
}

.model-card.disabled.selected-disabled {
  border-color: #6c757d;
  background: #e9ecef;
  opacity: 0.8;
}

.model-card.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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

.model-status {
  margin-top: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #28a745;
  color: white;
}

.status-badge.disabled {
  background: #6c757d;
  color: white;
}

.draft-section,
.style-selection,
.additional-request,
.generate-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.draft-section h3,
.style-selection h3,
.additional-request h3,
.generate-section h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #495057;
}

.section-description {
  color: #6c757d;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.generate-draft-btn {
  padding: 1rem 2rem;
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

.generate-draft-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.generate-draft-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 초안 비교 그리드 */
.drafts-comparison {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #667eea;
}

.drafts-comparison h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #495057;
  text-align: center;
}

.comparison-note {
  text-align: center;
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.drafts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.draft-card {
  position: relative;
  background: #f8f9fa;
  border: 3px solid #dee2e6;
  border-radius: 16px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.draft-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
}

.draft-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f2ff 0%, #e8ebff 100%);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
}

.draft-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.draft-badge.flux {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
}

.draft-image-wrapper {
  margin: 1rem 0;
  border-radius: 12px;
  overflow: hidden;
}

.draft-image-wrapper img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.model-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
  margin: 0.5rem 0 0.25rem 0;
}

.model-desc {
  color: #6c757d;
  font-size: 0.85rem;
  margin: 0;
}

.selected-info {
  text-align: center;
  color: #28a745;
  font-size: 1rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #d4edda;
  border-radius: 8px;
}

.style-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.style-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.style-option:hover {
  border-color: #667eea;
}

.style-option.selected {
  border-color: #667eea;
  background: #f0f2ff;
}

.style-option input[type="radio"] {
  margin-right: 1rem;
}

.style-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.style-icon {
  font-size: 2rem;
}

.style-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.style-desc {
  font-size: 0.85rem;
  color: #6c757d;
}

.request-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.request-input:focus {
  outline: none;
  border-color: #667eea;
}

.model-selection {
  margin: 1rem 0;
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

.generate-final-btn {
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  margin-top: 1rem;
}

.generate-final-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.generate-final-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.final-result {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.final-result h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #495057;
}

.final-image {
  text-align: center;
  margin: 1rem 0;
}

.final-image img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.result-actions {
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
  .style-options {
    grid-template-columns: 1fr;
  }
  
  .model-options {
    grid-template-columns: 1fr;
  }
}
</style>

