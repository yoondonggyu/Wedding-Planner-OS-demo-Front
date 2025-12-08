<template>
  <div class="invitation-view">
    <div class="container">
      <h1>✨ 청첩장 만들기</h1>
      <p class="workflow-description">
        단계별로 진행되는 청첩장 제작 프로세스입니다. 각 단계를 순서대로 완료해주세요.
      </p>
      
      <!-- 진행 상태 표시 -->
      <div class="progress-bar">
        <div
          v-for="step in steps"
          :key="step.number"
          class="progress-step"
          :class="{
            active: currentStep === step.number,
            completed: getStepCompleted(step.number),
            locked: !canAccessStep(step.number) && currentStep !== step.number
          }"
          @click="handleStepClick(step.number)"
        >
          <div class="step-circle">
            <span v-if="getStepCompleted(step.number)">✓</span>
            <span v-else>{{ step.number }}</span>
          </div>
          <div class="step-info">
          <div class="step-label">{{ step.label }}</div>
            <div class="step-description-small">{{ step.description }}</div>
          </div>
        </div>
      </div>

      <!-- 기본 정보 입력 모달 -->
      <InvitationBasicInfoModal
        :show="showBasicInfoModal"
        :saved-info="savedBasicInfo"
        @submit="handleBasicInfoSubmit"
        @close="showBasicInfoModal = false"
      />

      <!-- Step 1: 요구사항 입력 -->
      <div v-if="currentStep === 1" class="step-content">
        <div v-if="!canAccessStep(1)" class="access-denied">
          <p>⚠️ 먼저 기본 정보를 입력해주세요.</p>
          <button class="back-btn" @click="showBasicInfoModal = true">기본 정보 입력하기</button>
        </div>
        <InvitationRequirementsForm v-else :basic-info="basicInfo" @submit="handleRequirementsSubmit" />
      </div>

      <!-- Step 2: 톤 선택 (자동 제안) -->
      <div v-if="currentStep === 2" class="step-content">
        <div v-if="!canAccessStep(2)" class="access-denied">
          <p>⚠️ 먼저 요구사항을 입력해주세요.</p>
          <button class="back-btn" @click="currentStep = 1">요구사항 입력하러 가기</button>
        </div>
        <div v-else>
          <div class="step-header">
            <h2>🎨 AI가 제안한 5가지 톤</h2>
            <p class="step-description">
              입력하신 요구사항을 바탕으로 Gemini 2.5가 5가지 톤의 멘트를 자동으로 생성했습니다.<br>
              원하는 톤을 선택해주세요.
            </p>
          </div>
        <InvitationToneSelector
          :tones="tones"
          :loading="loadingTones"
          @select="handleToneSelect"
          @regenerate="handleRegenerateTones"
        />
        <div class="step-actions">
          <button class="back-btn" @click="currentStep--">← 이전</button>
          <button
            class="next-btn"
            @click="handleNextFromTone"
              :disabled="!selectedTone || !stepCompleted.step2"
          >
            다음 →
          </button>
          </div>
        </div>
      </div>

      <!-- Step 3: 디자인 생성 (1차 - 무료 모델) -->
      <div v-if="currentStep === 3" class="step-content">
        <div v-if="!canAccessStep(3)" class="access-denied">
          <p>⚠️ 먼저 기본 정보 입력과 톤 선택을 완료해주세요.</p>
          <div class="access-actions">
            <button class="back-btn" @click="currentStep = 1" v-if="!stepCompleted.step1">기본 정보 입력하러 가기</button>
            <button class="back-btn" @click="currentStep = 2" v-if="stepCompleted.step1 && !stepCompleted.step2">톤 선택하러 가기</button>
          </div>
        </div>
        <div v-else>
          <div class="step-header">
            <h2>🎨 청첩장 디자인 생성</h2>
            <p class="step-description">
              선택한 톤과 문구를 바탕으로 청첩장 디자인을 생성합니다.<br>
              원하는 디자인 스타일을 텍스트로 설명해주세요.
            </p>
          </div>
          <InvitationDesignStep
          :selected-text="selectedTone?.main_text || ''"
          :selected-tone="selectedTone?.tone || ''"
            :basic-info="basicInfo"
          @generate="handleImageGenerate"
            ref="designGenerator"
          />
          <div class="step-actions">
            <button class="back-btn" @click="currentStep--">← 이전</button>
            <button
              class="next-btn"
              @click="handleNextFromDesign"
              :disabled="!generatedImageUrl || !stepCompleted.step3"
            >
              다음 →
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4: 커스텀 (이미지 업로드 및 수정) -->
      <div v-if="currentStep === 4" class="step-content">
        <div v-if="!canAccessStep(4)" class="access-denied">
          <p>⚠️ 먼저 이전 단계들을 완료해주세요.</p>
          <div class="access-actions">
            <button class="back-btn" @click="showBasicInfoModal = true" v-if="!stepCompleted.step0">기본 정보 입력하러 가기</button>
            <button class="back-btn" @click="currentStep = 1" v-if="stepCompleted.step0 && !stepCompleted.step1">요구사항 입력하러 가기</button>
            <button class="back-btn" @click="currentStep = 2" v-if="stepCompleted.step0 && stepCompleted.step1 && !stepCompleted.step2">톤 선택하러 가기</button>
            <button class="back-btn" @click="currentStep = 3" v-if="stepCompleted.step0 && stepCompleted.step1 && stepCompleted.step2 && !stepCompleted.step3">디자인 생성하러 가기</button>
          </div>
        </div>
        <div v-else>
          <div class="step-header">
            <h2>✨ 청첩장 커스텀</h2>
            <p class="step-description">
              생성된 디자인을 이미지와 텍스트로 더 정교하게 수정할 수 있습니다.<br>
              <strong class="pro-badge">하루 5번 사용 제한</strong> - 남은 횟수: {{ remainingCustomCount }}회
            </p>
          </div>
          <InvitationDesignModifier
            :base-image="generatedImageUrl || ''"
            :selected-text="selectedTone?.main_text || ''"
            :remaining-count="remainingCustomCount"
            @modify="handleImageModifyPro"
            @skip="handleSkipModify"
          @save="handleImageSave"
            ref="designModifier"
        />
        <div class="step-actions">
          <button class="back-btn" @click="currentStep--">← 이전</button>
          </div>
        </div>
      </div>

      <!-- Step 5: 완료 -->
      <div v-if="currentStep === 5" class="step-content completion">
        <div class="success-message">
          <h2>🎉 청첩장이 완성되었습니다!</h2>
          <p class="success-subtitle">아래에서 완성된 청첩장을 확인하고 다운로드하세요.</p>
          
          <!-- 완성된 이미지 미리보기 -->
          <div class="final-image-preview" v-if="generatedImageUrl">
            <img :src="generatedImageUrl" alt="완성된 청첩장" />
          </div>
          
          <!-- 다운로드 버튼들 -->
          <div class="download-section">
            <h3>📥 이미지 다운로드</h3>
            <p class="download-hint">PC 또는 휴대폰에 이미지를 저장할 수 있습니다.</p>
            <div class="download-buttons">
              <button class="download-btn png" @click="downloadImage('png')">
                🖼️ PNG로 다운로드
              </button>
              <button class="download-btn jpeg" @click="downloadImage('jpeg')">
                📷 JPEG로 다운로드
              </button>
            </div>
          </div>
          
          <!-- 기타 액션 버튼 -->
          <div class="completion-actions">
            <button class="list-btn" @click="goToList">📋 목록으로</button>
            <button class="new-btn" @click="createNew">✨ 새로 만들기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InvitationBasicInfoModal from '@/components/invitation/InvitationBasicInfoModal.vue'
import InvitationRequirementsForm from '@/components/invitation/InvitationRequirementsForm.vue'
import InvitationToneSelector from '@/components/invitation/InvitationToneSelector.vue'
import InvitationDesignStep from '@/components/invitation/InvitationDesignStep.vue'
import InvitationDesignModifier from '@/components/invitation/InvitationDesignModifier.vue'
import { invitationService, type InvitationBasicInfo, type ToneOption, type MapInfo } from '@/services/invitationService'

const router = useRouter()

const currentStep = ref(1)
const steps = [
  { number: 1, label: '요구사항 입력', description: '청첩장 요구사항 입력' },
  { number: 2, label: '톤 선택', description: 'AI가 생성한 5가지 톤 중 선택' },
  { number: 3, label: '디자인 생성', description: '초안, 스타일 선택, 이미지 생성' },
  { number: 4, label: '커스텀', description: '이미지 업로드 및 수정 (하루 5번)' },
  { number: 5, label: '완료', description: '청첩장 완성' }
]

// 기본 정보 모달
const showBasicInfoModal = ref(false)
const savedBasicInfo = ref<InvitationBasicInfo & { mapInfo?: MapInfo } | null>(null)

// 단계별 완료 상태 관리
const stepCompleted = ref({
  step0: false, // 기본 정보 입력 완료 (모달에서)
  step1: false, // 요구사항 입력 완료
  step2: false, // 톤 선택 완료
  step3: false, // 디자인 생성 완료
  step4: false  // 커스텀 완료 (선택사항)
})

// 요구사항 입력 데이터
const requirements = ref('')

// Step 1 data
const basicInfo = ref<InvitationBasicInfo & { mapInfo?: MapInfo }>()

// Step 2 data
const tones = ref<ToneOption[]>([])
const loadingTones = ref(false)
const selectedTone = ref<ToneOption | null>(null)

// Step 3 data (디자인 생성)
const designGenerator = ref<InstanceType<typeof InvitationDesignStep>>()
const generatedImageUrl = ref('')
const originalGeneratedImageUrl = ref('') // 원본 이미지 보존용
const designRequirements = ref('')

// Step 4 data (커스텀)
const designModifier = ref<InstanceType<typeof InvitationDesignModifier>>()
const remainingCustomCount = ref(5) // 하루 5번 제한

// Design data
const designId = ref<number>()

// 저장된 기본 정보 로드 (컴포넌트 마운트 시)
onMounted(() => {
  try {
    const saved = localStorage.getItem('invitation_basic_info')
    if (saved) {
      savedBasicInfo.value = JSON.parse(saved)
      basicInfo.value = savedBasicInfo.value
      stepCompleted.value.step0 = true
    } else {
      // 저장된 정보가 없으면 모달 자동 열기
      showBasicInfoModal.value = true
    }
  } catch (error) {
    console.error('저장된 기본 정보 로드 실패:', error)
    // 에러 발생 시 모달 열기
    showBasicInfoModal.value = true
  }
  
  // 커스텀 사용 횟수 로드
  loadCustomCount()
})

// 커스텀 사용 횟수 로드
const loadCustomCount = () => {
  try {
    const today = new Date().toDateString()
    const saved = localStorage.getItem(`custom_count_${today}`)
    if (saved) {
      remainingCustomCount.value = Math.max(0, 5 - parseInt(saved))
    } else {
      remainingCustomCount.value = 5
    }
  } catch (error) {
    console.error('커스텀 사용 횟수 로드 실패:', error)
  }
}

// 단계 접근 제어 함수
const canAccessStep = (stepNumber: number): boolean => {
  if (stepNumber === 1) return stepCompleted.value.step0 // 기본 정보 입력 완료 필요
  if (stepNumber === 2) return stepCompleted.value.step0 && stepCompleted.value.step1
  if (stepNumber === 3) return stepCompleted.value.step0 && stepCompleted.value.step1 && stepCompleted.value.step2
  if (stepNumber === 4) return stepCompleted.value.step0 && stepCompleted.value.step1 && stepCompleted.value.step2 && stepCompleted.value.step3
  if (stepNumber === 5) return stepCompleted.value.step0 && stepCompleted.value.step1 && stepCompleted.value.step2 && stepCompleted.value.step3
  return false
}

// 단계 완료 여부 확인
const getStepCompleted = (stepNumber: number): boolean => {
  if (stepNumber === 1) return stepCompleted.value.step1
  if (stepNumber === 2) return stepCompleted.value.step2
  if (stepNumber === 3) return stepCompleted.value.step3
  if (stepNumber === 4) return stepCompleted.value.step4
  if (stepNumber === 5) return stepCompleted.value.step3 // Step 5는 Step 3 완료 시 활성화
  return false
}

// 단계 클릭 핸들러 (접근 가능한 단계만 이동)
const handleStepClick = (stepNumber: number) => {
  if (canAccessStep(stepNumber)) {
    currentStep.value = stepNumber
  } else {
    // 접근 불가능한 단계 클릭 시 안내
    const requiredSteps = []
    if (stepNumber >= 1 && !stepCompleted.value.step0) requiredSteps.push('기본 정보 입력')
    if (stepNumber >= 2 && !stepCompleted.value.step1) requiredSteps.push('요구사항 입력')
    if (stepNumber >= 3 && !stepCompleted.value.step2) requiredSteps.push('톤 선택')
    if (stepNumber >= 4 && !stepCompleted.value.step3) requiredSteps.push('디자인 생성')
    
    if (requiredSteps.length > 0) {
      alert(`먼저 ${requiredSteps.join(', ')}을(를) 완료해주세요.`)
    }
  }
}

// 기본 정보 제출 (모달에서)
const handleBasicInfoSubmit = async (data: InvitationBasicInfo & { mapInfo?: MapInfo }) => {
  basicInfo.value = data
  savedBasicInfo.value = data
  
  // 기본 정보 저장 (로컬 스토리지 또는 백엔드)
  try {
    localStorage.setItem('invitation_basic_info', JSON.stringify(data))
  } catch (error) {
    console.error('기본 정보 저장 실패:', error)
  }
  
  // Step 0 완료 표시
  stepCompleted.value.step0 = true
  showBasicInfoModal.value = false
  
  // 디자인 생성 (기본 정보 포함)
  try {
    const response = await invitationService.createDesign({
      groom_name: data.groom_name,
      bride_name: data.bride_name,
      groom_father_name: data.groom_father_name,
      groom_mother_name: data.groom_mother_name,
      bride_father_name: data.bride_father_name,
      bride_mother_name: data.bride_mother_name,
      wedding_date: data.wedding_date,
      wedding_time: data.wedding_time,
      wedding_location: data.wedding_location,
      wedding_location_detail: data.wedding_location_detail,
      map_address: data.wedding_location,
      additional_message: data.additional_message,
      design_data: {
        ...data,
        map_lat: data.mapInfo?.lat,
        map_lng: data.mapInfo?.lng,
        map_image_url: data.mapInfo?.map_image_url
      }
    })
    
    designId.value = response.data.id
    console.log('디자인 생성 성공:', designId.value)
  } catch (error) {
    console.error('디자인 생성 실패:', error)
    alert('디자인 생성에 실패했습니다.')
    return
  }
}

// Step 1: 요구사항 제출
const handleRequirementsSubmit = async (req: string) => {
  requirements.value = req
  
  // Step 1 완료 표시
  stepCompleted.value.step1 = true
  
  // 자동으로 톤 생성 및 Step 2로 이동
  currentStep.value = 2
  await loadTones()
}

// Step 2: 톤 로드 (자동 생성)
const loadTones = async () => {
  console.log('🔄 loadTones 호출됨')
  console.log('basicInfo.value:', basicInfo.value)
  
  if (!basicInfo.value) {
    alert('기본 정보가 없습니다. 기본 정보를 먼저 입력해주세요.')
    showBasicInfoModal.value = true
    return
  }
  
  loadingTones.value = true
  try {
    // 기본 정보 + 요구사항을 함께 전달하여 톤 생성
    const toneRequest = {
      ...basicInfo.value,
      requirements: requirements.value // 요구사항 추가
    }
    
    console.log('📤 톤 생성 요청:', toneRequest)
    
    // requirements 필드를 additional_message로 매핑 (API 호환성)
    const response = await invitationService.generateTones({
      groom_name: toneRequest.groom_name,
      bride_name: toneRequest.bride_name,
      groom_father_name: toneRequest.groom_father_name,
      groom_mother_name: toneRequest.groom_mother_name,
      bride_father_name: toneRequest.bride_father_name,
      bride_mother_name: toneRequest.bride_mother_name,
      wedding_date: toneRequest.wedding_date,
      wedding_time: toneRequest.wedding_time,
      wedding_location: toneRequest.wedding_location,
      additional_message: toneRequest.additional_message,
      requirements: toneRequest.requirements // 요구사항 추가
    })
    
    console.log('📥 톤 생성 응답:', response)
    console.log('tones 배열:', response.data?.tones)
    
    // 배열이 제대로 전달되는지 확인
    if (response.data?.tones && Array.isArray(response.data.tones)) {
      tones.value = response.data.tones
      console.log('✅ tones.value 설정됨:', tones.value.length, '개')
      console.log('톤 목록:', tones.value.map(t => t.description || t.tone))
    } else {
      console.error('❌ tones 데이터 형식 오류:', response.data)
      alert('톤 데이터 형식이 올바르지 않습니다.')
    }
  } catch (error) {
    console.error('❌ 톤 생성 실패:', error)
    alert('톤 생성에 실패했습니다.')
  } finally {
    loadingTones.value = false
  }
}

// Step 2: 톤 선택
const handleToneSelect = (tone: ToneOption) => {
  selectedTone.value = tone
  // 톤 선택 시 step2 완료 표시
  stepCompleted.value.step2 = true
}

// Step 2: 톤 재생성
const handleRegenerateTones = async () => {
  selectedTone.value = null
  stepCompleted.value.step2 = false
  await loadTones()
}

// Step 2: 다음 단계
const handleNextFromTone = () => {
  if (!selectedTone.value) {
    alert('톤을 선택해주세요.')
    return
  }
  
  // Step 2 완료 표시
  stepCompleted.value.step2 = true
  
  // Step 3로 이동
  currentStep.value = 3
}

// Step 3: 디자인 생성 (초안, 스타일 선택, 추가 요청, 이미지 생성)
const handleImageGenerate = async (data: { image: string; prompt: string; style: string; additionalRequest: string; model?: string }) => {
  // designId가 없으면 자동으로 생성
  if (!designId.value) {
    if (!basicInfo.value) {
      alert('기본 정보가 없습니다. 먼저 기본 정보를 입력해주세요.')
      showBasicInfoModal.value = true
      return
    }
    
    try {
      const response = await invitationService.createDesign({
        groom_name: basicInfo.value.groom_name,
        bride_name: basicInfo.value.bride_name,
        groom_father_name: basicInfo.value.groom_father_name,
        groom_mother_name: basicInfo.value.groom_mother_name,
        bride_father_name: basicInfo.value.bride_father_name,
        bride_mother_name: basicInfo.value.bride_mother_name,
        wedding_date: basicInfo.value.wedding_date,
        wedding_time: basicInfo.value.wedding_time,
        wedding_location: basicInfo.value.wedding_location,
        wedding_location_detail: basicInfo.value.wedding_location_detail,
        map_address: basicInfo.value.wedding_location,
        additional_message: basicInfo.value.additional_message,
        design_data: {
          ...basicInfo.value,
          map_lat: basicInfo.value.mapInfo?.lat,
          map_lng: basicInfo.value.mapInfo?.lng
        }
      })
      
      designId.value = response.data.id
      console.log('디자인 자동 생성 성공:', designId.value)
    } catch (error) {
      console.error('디자인 생성 실패:', error)
      alert('디자인 생성에 실패했습니다. 다시 시도해주세요.')
      return
    }
  }
  
  if (!selectedTone.value) {
    alert('톤이 선택되지 않았습니다. 먼저 톤을 선택해주세요.')
    currentStep.value = 2
    return
  }

  designGenerator.value?.setLoading(true)
  designRequirements.value = data.additionalRequest
  
  try {
    // 선택한 모델로 이미지 생성
    const selectedModel = data.model || 'gemini' // 기본값: Gemini 3 Pro Image Preview
    
    // 모델에 따라 model_type 결정 (하위 호환성)
    // Gemini 모델은 pro, 나머지는 free
    const modelType = selectedModel === 'gemini' ? 'pro' : 'free'
    
    const response = await invitationService.generateImage({
      design_id: designId.value!,
      selected_tone: selectedTone.value.tone,
      selected_text: selectedTone.value.main_text,
      prompt: data.prompt,
      model: selectedModel, // 선택한 모델 전달
      model_type: modelType, // 하위 호환성
      base_image_url: data.image || undefined
    })
    
    const imageB64 = response.data.image_b64
    designGenerator.value?.setFinalImage(imageB64)
    generatedImageUrl.value = imageB64
    originalGeneratedImageUrl.value = imageB64 // 원본 이미지 보존
    
    // Step 3 완료 표시 (이미지 생성 완료 시)
    stepCompleted.value.step3 = true
  } catch (error: any) {
    console.error('이미지 생성 실패:', error)
    console.error('에러 상세:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    })
    
    // 더 자세한 에러 메시지 표시
    let errorMessage = '이미지 생성에 실패했습니다.'
    if (error?.response?.data?.detail) {
      errorMessage = `이미지 생성 실패: ${error.response.data.detail}`
    } else if (error?.response?.data?.message) {
      errorMessage = `이미지 생성 실패: ${error.response.data.message}`
    } else if (error?.message) {
      errorMessage = `이미지 생성 실패: ${error.message}`
    }
    
    alert(errorMessage)
  } finally {
    designGenerator.value?.setLoading(false)
  }
}

// Step 3: 다음 단계로 (수정 단계로 이동) - 더 이상 사용 안 함
const handleNextToModify = () => {
  // 이 함수는 더 이상 사용하지 않음 (InvitationDesignStep에서 호출하지 않음)
}

// Step 3: 다음 버튼 클릭 (선택한 톤을 프롬프트로 사용해서 다음 단계로)
const handleNextFromDesign = () => {
  if (!generatedImageUrl.value) {
    alert('먼저 디자인을 생성해주세요.')
    return
  }
  
  if (!selectedTone.value) {
    alert('톤이 선택되지 않았습니다.')
    return
  }
  
  // 선택한 톤의 텍스트를 프롬프트로 사용
  // Step 4로 이동 (커스텀 단계)
  currentStep.value = 4
}

// Step 4: 커스텀 (이미지 수정)
const handleImageModifyPro = async (data: { image: string; prompt: string; textRequirements: string; model: string }) => {
  if (!designId.value) {
    alert('디자인 정보가 없습니다.')
    return
  }

  // 하루 5번 제한 확인
  if (remainingCustomCount.value <= 0) {
    alert('하루 사용 횟수(5회)를 모두 사용하셨습니다. 내일 다시 시도해주세요.')
    return
  }

  designModifier.value?.setLoading(true)
  
  try {
    // 선택한 모델로 수정
    const response = await invitationService.modifyImage({
      design_id: designId.value,
      base_image_url: data.image,
      modification_prompt: data.prompt,
      model: data.model, // 선택한 모델 사용
      // 하위 호환성을 위해 model_type도 설정 (model이 있으면 무시됨)
      model_type: data.model === 'gemini' ? 'pro' : 'free'
    })
    
    const imageB64 = response.data.image_b64
    designModifier.value?.setGeneratedImage(imageB64)
    // generatedImageUrl은 원본 유지, 수정된 이미지는 InvitationDesignModifier에서 관리
    // generatedImageUrl.value = imageB64  // 원본 유지를 위해 주석 처리
    
    // 사용 횟수 차감
    const today = new Date().toDateString()
    const currentCount = parseInt(localStorage.getItem(`custom_count_${today}`) || '0')
    localStorage.setItem(`custom_count_${today}`, String(currentCount + 1))
    remainingCustomCount.value = Math.max(0, 5 - (currentCount + 1))
    
    // Step 4 완료 표시
    stepCompleted.value.step4 = true
  } catch (error: any) {
    console.error('이미지 수정 실패:', error)
    const errorMessage = error?.response?.data?.detail || '이미지 수정에 실패했습니다.'
    alert(errorMessage)
  } finally {
    designModifier.value?.setLoading(false)
  }
}

// Step 4: 커스텀 건너뛰기
const handleSkipModify = () => {
  if (confirm('커스텀을 건너뛰고 완료하시겠습니까?')) {
    handleImageSave(generatedImageUrl.value)
  }
}

// Step 4/5: 이미지 저장 및 완료
const handleImageSave = async (image: string) => {
  if (!designId.value) {
    alert('디자인 정보가 없습니다. 새로고침 후 다시 시도해주세요.')
    return
  }

  if (!image) {
    alert('저장할 이미지가 없습니다.')
    return
  }

  try {
    console.log('저장 시작:', { designId: designId.value, imageLength: image.length })
    
    // 최종 이미지 URL 저장 (generatedImageUrl 업데이트)
    generatedImageUrl.value = image
    
    await invitationService.updateDesign(designId.value, {
      design_data: {
        ...basicInfo.value,
        generated_image_url: image,
        selected_tone: selectedTone.value?.tone,
        selected_text: selectedTone.value?.main_text,
        design_requirements: designRequirements.value
      },
      status: 'COMPLETED'
    })
    
    console.log('저장 성공!')
    currentStep.value = 5
  } catch (error: any) {
    console.error('저장 실패:', error)
    console.error('에러 상세:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    })
    
    let errorMessage = '저장에 실패했습니다.'
    if (error?.response?.data?.detail) {
      errorMessage = `저장 실패: ${error.response.data.detail}`
    } else if (error?.response?.data?.message) {
      errorMessage = `저장 실패: ${error.response.data.message}`
    } else if (error?.message) {
      errorMessage = `저장 실패: ${error.message}`
    }
    
    alert(errorMessage)
  }
}

// Step 5: 완료 후 액션

// 이미지 다운로드 함수
const downloadImage = (format: 'png' | 'jpeg') => {
  if (!generatedImageUrl.value) {
    alert('다운로드할 이미지가 없습니다.')
    return
  }
  
  try {
    // base64 데이터 URL에서 실제 데이터 추출
    const imageData = generatedImageUrl.value
    
    // 파일명 생성 (신랑_신부_청첩장_날짜)
    const groomName = basicInfo.value?.groom_name || '신랑'
    const brideName = basicInfo.value?.bride_name || '신부'
    const today = new Date().toISOString().split('T')[0]
    const fileName = `${groomName}_${brideName}_청첩장_${today}.${format}`
    
    // 다운로드 링크 생성
    const link = document.createElement('a')
    
    if (format === 'jpeg' && imageData.includes('image/png')) {
      // PNG를 JPEG로 변환해야 하는 경우
      const canvas = document.createElement('canvas')
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // 흰색 배경 (JPEG는 투명도 미지원)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          
          const jpegData = canvas.toDataURL('image/jpeg', 0.95)
          link.href = jpegData
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
      img.src = imageData
    } else {
      // 원본 형식 그대로 다운로드
      link.href = imageData
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    console.log(`이미지 다운로드: ${fileName}`)
  } catch (error) {
    console.error('다운로드 실패:', error)
    alert('이미지 다운로드에 실패했습니다. 다시 시도해주세요.')
  }
}

const goToList = () => {
  router.push('/invitation/list')
}

const createNew = () => {
  currentStep.value = 1
  requirements.value = ''
  tones.value = []
  selectedTone.value = null
  generatedImageUrl.value = ''
  originalGeneratedImageUrl.value = '' // 원본 이미지도 초기화
  designRequirements.value = ''
  designId.value = undefined
  
  // 모든 단계 완료 상태 초기화 (기본 정보는 유지)
  stepCompleted.value = {
    step0: stepCompleted.value.step0, // 기본 정보는 유지
    step1: false,
    step2: false,
    step3: false,
    step4: false
  }
}
</script>

<style scoped>
.invitation-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.workflow-description {
  text-align: center;
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.info-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.info-banner p {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.open-modal-btn {
  padding: 0.75rem 2rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.open-modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.progress-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.4;
  transition: opacity 0.3s;
}

.progress-step.active,
.progress-step.completed {
  opacity: 1;
}

.step-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  color: #6c757d;
  transition: all 0.3s;
}

.progress-step.active .step-circle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.progress-step.completed .step-circle {
  background: #28a745;
  color: white;
}

.progress-step.locked {
  opacity: 0.3;
  cursor: not-allowed;
}

.progress-step.locked .step-circle {
  background: #dee2e6;
  color: #adb5bd;
}

.progress-step:not(.locked) {
  cursor: pointer;
}

.progress-step:not(.locked):hover {
  opacity: 0.8;
}

.step-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.step-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6c757d;
  text-align: center;
}

.step-description-small {
  font-size: 0.75rem;
  color: #adb5bd;
  text-align: center;
  max-width: 120px;
}

.progress-step.active .step-label {
  color: #667eea;
}

.progress-step.active .step-description-small {
  color: #667eea;
}

.access-denied {
  text-align: center;
  padding: 3rem 2rem;
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 12px;
  margin: 2rem 0;
}

.access-denied p {
  font-size: 1.2rem;
  color: #856404;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.access-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.step-description {
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.6;
}

.pro-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.step-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.back-btn,
.next-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn {
  background: #6c757d;
  color: white;
}

.back-btn:hover {
  background: #5a6268;
  transform: translateX(-2px);
}

.next-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.next-btn:hover:not(:disabled) {
  transform: translateX(2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.next-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.completion {
  text-align: center;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.success-message h2 {
  font-size: 2rem;
  color: #28a745;
  margin-bottom: 0.5rem;
}

.success-subtitle {
  color: #6c757d;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

/* 완성된 이미지 미리보기 */
.final-image-preview {
  margin: 1.5rem auto;
  max-width: 500px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.final-image-preview img {
  width: 100%;
  display: block;
}

/* 다운로드 섹션 */
.download-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
}

.download-section h3 {
  font-size: 1.3rem;
  color: #495057;
  margin-bottom: 0.5rem;
}

.download-hint {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.download-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.download-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 180px;
}

.download-btn.png {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.download-btn.png:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.download-btn.jpeg {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.download-btn.jpeg:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.6);
}

.completion-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #dee2e6;
}

.list-btn,
.new-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 150px;
}

.list-btn {
  background: #28a745;
  color: white;
}

.list-btn:hover {
  background: #218838;
  transform: translateY(-2px);
}

.new-btn {
  background: #6c757d;
  color: white;
}

.view-btn:hover,
.list-btn:hover,
.new-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .progress-bar {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .step-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  /* 완료 화면 반응형 */
  .completion {
    padding: 1rem;
  }
  
  .success-message h2 {
    font-size: 1.5rem;
  }
  
  .final-image-preview {
    max-width: 100%;
    border-radius: 12px;
  }
  
  .download-section {
    padding: 1rem;
  }
  
  .download-buttons {
    flex-direction: column;
  }
  
  .download-btn {
    width: 100%;
    min-width: auto;
  }
  
  .completion-actions {
    flex-direction: column;
  }
  
  .list-btn,
  .new-btn {
    width: 100%;
    min-width: auto;
  }
}

/* 작은 모바일 */
@media (max-width: 480px) {
  .success-message h2 {
    font-size: 1.3rem;
  }
  
  .success-subtitle {
    font-size: 0.95rem;
  }
  
  .download-section h3 {
    font-size: 1.1rem;
  }
}
</style>

