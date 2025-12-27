<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

interface OrganizedItem {
  type: 'budget_item' | 'todo' | 'post' | 'calendar_event'
  title?: string
  item_name?: string
  amount?: number
  date?: string
}

const authStore = useAuthStore()
const { request } = useApi()

const isRecording = ref(false)
const recordStatus = ref('마이크 버튼을 눌러 음성을 입력하세요')
const textInput = ref('')
const isProcessing = ref(false)

const transcriptionText = ref('')
const organizedItems = ref<OrganizedItem[]>([])
const responseText = ref('')

const showTranscription = ref(false)
const showOrganized = ref(false)
const showResponse = ref(false)

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

// 로그인 체크 제거 - 로그인 없이도 접근 가능
const canAccess = computed(() => true)

onMounted(() => {
  // 로그인 체크 제거됨
})

async function toggleRecording() {
  if (!isRecording.value) {
    await startRecording()
  } else {
    stopRecording()
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      await processAudio(audioBlob)
      stream.getTracks().forEach((track) => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true
    recordStatus.value = '🎙️ 녹음 중... (다시 클릭하여 중지)'
  } catch (error) {
    console.error('마이크 접근 실패:', error)
    alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.')
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    recordStatus.value = '⏳ 처리 중...'
  }
}

async function processAudio(audioBlob: Blob) {
  try {
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1]
      await processVoice(base64Audio, null)
    }
    reader.readAsDataURL(audioBlob)
  } catch (error) {
    console.error('오디오 처리 실패:', error)
    alert('오디오 처리에 실패했습니다.')
    resetRecordingState()
  }
}

async function processText() {
  const text = textInput.value.trim()
  if (!text || isProcessing.value) return

  recordStatus.value = '⏳ 처리 중...'
  isProcessing.value = true
  textInput.value = ''

  await processVoice(null, text)
}

async function processVoice(audioData: string | null, text: string | null) {
  try {
    const res = await request<{
      message: string
      data: {
        transcribed_text: string
        organized_items?: OrganizedItem[]
        intent?: string
      }
    }>(`/voice/process`, {
      method: 'POST',
      body: {
        audio_data: audioData,
        text: text,
        user_id: authStore.user!.id,
        auto_organize: true,
      },
    })

    if (res.message === 'voice_processed' || res.message === 'voice_transcribed') {
      const transcribed = res.data.transcribed_text

      // 전사 결과 표시
      transcriptionText.value = transcribed || '(전사 실패)'
      showTranscription.value = true

      // 자동 정리 결과 표시
      if (res.data.organized_items && res.data.organized_items.length > 0) {
        organizedItems.value = res.data.organized_items
        showOrganized.value = true
      } else {
        showOrganized.value = false
      }

      // 질문인 경우 답변 생성
      if (res.data.intent === 'query') {
        await generateResponse(transcribed)
      } else {
        showResponse.value = false
      }

      // 상태 초기화
      resetRecordingState()
      isProcessing.value = false
    } else {
      throw new Error('처리 실패')
    }
  } catch (error) {
    console.error('음성 처리 오류:', error)
    alert('음성 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
    resetRecordingState()
    isProcessing.value = false
  }
}

function resetRecordingState() {
  recordStatus.value = '✅ 처리 완료! 다시 녹음하려면 버튼을 클릭하세요.'
}

function formatCurrency(amount?: number) {
  if (!amount) return '0원'
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
}

function getItemIcon(type: string) {
  const icons: Record<string, string> = {
    budget_item: '💰',
    todo: '✅',
    post: '📝',
    calendar_event: '📅',
  }
  return icons[type] || '📋'
}

function getItemTypeName(type: string) {
  const names: Record<string, string> = {
    budget_item: '예산 항목',
    todo: '할일',
    post: '게시글',
    calendar_event: '캘린더 일정',
  }
  return names[type] || '항목'
}

function getItemDescription(item: OrganizedItem) {
  if (item.type === 'budget_item') {
    return `${item.title || item.item_name || '항목'} - ${formatCurrency(item.amount || 0)}`
  } else if (item.type === 'todo') {
    return item.title || '할일'
  } else if (item.type === 'post') {
    return item.title || '게시글'
  } else if (item.type === 'calendar_event') {
    return `${item.title || '일정'} - ${item.date || ''}`
  }
  return ''
}

async function generateResponse(query: string) {
  try {
    const res = await request<{ message: string; data: { response: string } }>(
      `/voice/response?query=${encodeURIComponent(query)}&user_id=${authStore.user!.id}`,
      { method: 'GET' }
    )

    if (res.message === 'voice_response_generated') {
      responseText.value = res.data.response
      showResponse.value = true
    }
  } catch (error) {
    console.error('답변 생성 오류:', error)
    showResponse.value = false
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    processText()
  }
}
</script>

<template>
  <section class="section" id="voice">
    <div class="container">
      <div class="page-title">
        <h1>🎤 음성 비서</h1>
        <p>STT + LLM + 자동 정리 파이프라인 - 핸즈프리 웨딩 플래너</p>
      </div>

      <div class="card">
        <div class="voice-interface">
          <!-- 음성 녹음 버튼 -->
          <div class="record-button-container">
            <button
              class="record-button"
              :class="{ recording: isRecording }"
              type="button"
              @click="toggleRecording"
              :disabled="isProcessing"
              title="마이크 버튼을 눌러 음성을 입력하세요"
            >
              🎤
            </button>
          </div>
          <div class="record-status" :class="{ recording: isRecording, processing: isProcessing }">
            {{ recordStatus }}
          </div>

          <!-- 텍스트 직접 입력 -->
          <div class="text-input-section">
            <div style="font-size: 14px; color: var(--muted); margin-bottom: 8px">또는 직접 텍스트로 입력</div>
            <div class="text-input-area">
              <input
                v-model="textInput"
                type="text"
                class="text-input"
                placeholder="예: 다음 주 토요일에 스튜디오 투어 일정 잡아줘"
                :disabled="isProcessing"
                @keypress="handleKeyPress"
              />
              <button class="btn primary" type="button" :disabled="isProcessing" @click="processText">
                처리
              </button>
            </div>
          </div>

          <!-- 결과 표시 영역 -->
          <div v-if="showTranscription || showOrganized || showResponse" class="result-section">
            <!-- 전사 결과 -->
            <div v-if="showTranscription" class="result-card">
              <h4>📝 전사 결과</h4>
              <div class="result-text">{{ transcriptionText }}</div>
            </div>

            <!-- 자동 정리 결과 -->
            <div v-if="showOrganized && organizedItems.length > 0" class="result-card">
              <h4>✨ 자동 정리 결과</h4>
              <div class="organized-items">
                <div v-for="(item, idx) in organizedItems" :key="idx" class="organized-item">
                  <div class="organized-item-icon">{{ getItemIcon(item.type) }}</div>
                  <div class="organized-item-content">
                    <div class="organized-item-title">{{ getItemTypeName(item.type) }} 생성됨</div>
                    <div class="organized-item-desc">{{ getItemDescription(item) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 답변 -->
            <div v-if="showResponse" class="result-card">
              <h4>💬 답변</h4>
              <div class="result-text">{{ responseText }}</div>
            </div>
          </div>

          <!-- 예시 명령어 -->
          <div class="example-commands">
            <h4>💡 사용 예시</h4>
            <ul class="example-list">
              <li>"다음 주 토요일에 스튜디오 투어 일정 잡아줘"</li>
              <li>"3월 둘째 주에 스튜디오 상담 일정 잡아줘"</li>
              <li>"스드메 290만 원으로 예산 잡아줘"</li>
              <li>"웨딩홀 비용 조금 늘릴게"</li>
              <li>"이번 달 예산 상황 말해줘"</li>
              <li>"오늘 촬영 컨셉 아이디어 떠올랐어"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.voice-interface {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.record-button-container {
  position: relative;
  margin: 40px 0;
}

.record-button {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border: 0;
  color: #0b0d12;
  font-size: 56px;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.record-button:hover {
  transform: scale(1.05);
}

.record-button.recording {
  background: var(--danger);
  animation: pulse 1.5s infinite;
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.5);
}

.record-button.recording::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.3);
  animation: ripple 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.record-status {
  margin-top: 24px;
  font-size: 18px;
  font-weight: 600;
  color: var(--muted);
  min-height: 28px;
}

.record-status.recording {
  color: var(--danger);
}

.record-status.processing {
  color: var(--accent);
}

.text-input-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.text-input-area {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.text-input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
}

.text-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.result-section {
  margin-top: 32px;
  text-align: left;
}

.result-card {
  background: var(--soft);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.result-card h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--accent);
}

.result-text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
}

.organized-items {
  margin-top: 16px;
}

.organized-item {
  background: var(--card);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.organized-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.organized-item-content {
  flex: 1;
}

.organized-item-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.organized-item-desc {
  font-size: 12px;
  color: var(--muted);
}

.example-commands {
  margin-top: 32px;
  padding: 20px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.example-commands h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--accent);
}

.example-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.example-list li {
  padding: 8px 0;
  font-size: 13px;
  color: var(--muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.example-list li:last-child {
  border-bottom: 0;
}

.example-list li::before {
  content: '💬 ';
  margin-right: 8px;
}

/* 모바일 스타일 */
@media (max-width: 768px) {
  .section {
    padding: 16px 8px;
  }

  .container {
    padding: 0 12px;
  }

  .page-title h1 {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .page-title p {
    font-size: 12px;
  }

  .card {
    padding: 16px;
  }

  .voice-interface {
    max-width: 100%;
  }

  .record-button-container {
    margin: 24px 0;
  }

  .record-button {
    width: 120px;
    height: 120px;
    font-size: 48px;
  }

  .record-status {
    font-size: 14px;
    margin-top: 16px;
  }

  .text-input-section {
    margin-top: 24px;
    padding-top: 24px;
  }

  .text-input-area {
    flex-direction: column;
    gap: 8px;
  }

  .text-input {
    width: 100%;
    padding: 10px;
    font-size: 14px;
  }

  .text-input-area > button {
    width: 100%;
    padding: 12px;
    font-size: 14px;
  }

  .result-section {
    margin-top: 24px;
  }

  .result-card {
    padding: 16px;
    margin-bottom: 12px;
  }

  .result-card h4 {
    font-size: 14px;
    margin-bottom: 10px;
  }

  .result-text {
    font-size: 13px;
  }

  .organized-item {
    padding: 10px;
    gap: 10px;
  }

  .organized-item-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .organized-item-title {
    font-size: 13px;
  }

  .organized-item-desc {
    font-size: 11px;
  }

  .example-commands {
    margin-top: 24px;
    padding: 16px;
  }

  .example-commands h4 {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .example-list li {
    padding: 6px 0;
    font-size: 12px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .record-button {
    width: 100px;
    height: 100px;
    font-size: 40px;
  }

  .record-status {
    font-size: 12px;
  }

  .result-card {
    padding: 12px;
  }

  .result-text {
    font-size: 12px;
  }

  .organized-item {
    padding: 8px;
  }

  .organized-item-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}
</style>
