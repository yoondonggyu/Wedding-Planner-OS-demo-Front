<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/config/env'

interface ChatMessage {
  id?: number
  role: 'user' | 'bot'
  content: string
  sentiment?: {
    label: string
    explanation: string
  }
  isSaved?: boolean
}

const authStore = useAuthStore()
const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const isConnected = ref(false)
const messagesContainer = ref<HTMLDivElement | null>(null)
const ws = ref<WebSocket | null>(null)
const showSaveModal = ref(false)
const selectedMessage = ref<ChatMessage | null>(null)
const saveTitle = ref('')
const saveTags = ref<string[]>([])
const tagInput = ref('')
const savedMemories = ref<any[]>([])
const showMemoriesList = ref(false)
const availableModels = ref<any[]>([])
const selectedModel = ref<string | null>(null)
const showModelSelector = ref(false)

// 로그인 체크 제거 - 로그인 없이도 접근 가능
const canAccess = computed(() => true)

// WebSocket 연결
function connectWebSocket() {
  if (!authStore.accessToken || !authStore.user) {
    // 로그인하지 않은 경우에도 연결 시도하지 않음 (에러 방지)
    return
  }

  try {
    // WebSocket URL 생성 (HTTP -> WS 변환)
    let wsBaseUrl = API_BASE_URL
    if (wsBaseUrl.startsWith('http://')) {
      wsBaseUrl = wsBaseUrl.replace('http://', 'ws://')
    } else if (wsBaseUrl.startsWith('https://')) {
      wsBaseUrl = wsBaseUrl.replace('https://', 'wss://')
    } else {
      // 기본값 처리
      wsBaseUrl = 'ws://localhost:8101/api'
    }
    const wsEndpoint = `${wsBaseUrl}/chat/ws?token=${encodeURIComponent(authStore.accessToken)}`
    
    console.log('WebSocket 연결 시도:', wsEndpoint.replace(authStore.accessToken, 'TOKEN'))
    ws.value = new WebSocket(wsEndpoint)

    ws.value.onopen = () => {
      console.log('WebSocket 연결 성공')
      isConnected.value = true
    }

    ws.value.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)

        // 감정 분석 결과
        if (data.type === 'sentiment' && data.data) {
          const sentimentData = {
            label: data.data.label || '분석 중...',
            explanation: data.data.explanation || '',
          }
          // 감정 분석 메시지 추가
          const botMsgIndex = messages.value.length
          messages.value.splice(botMsgIndex, 0, {
            role: 'bot',
            content: `💭 감정 분석: ${sentimentData.label}\n${sentimentData.explanation}`,
            sentiment: sentimentData,
          })
          await nextTick()
          scrollToBottom()
        }

        // Thinking 처리 (DeepSeek R1 등)
        if (data.type === 'thinking_start') {
          // Thinking 시작 - 로딩 메시지에 표시
          const loadingIndex = messages.value.findIndex(m => m.content === '답변을 생성하는 중...')
          if (loadingIndex !== -1) {
            messages.value[loadingIndex].content = '🤔 생각 중...'
          }
        }
        
        if (data.type === 'thinking' && data.content) {
          // Thinking 내용 업데이트 (선택적, 너무 많이 업데이트하지 않도록)
          const loadingIndex = messages.value.findIndex(m => m.content.includes('🤔 생각 중'))
          if (loadingIndex !== -1) {
            // Thinking은 너무 자주 업데이트하지 않음
          }
        }
        
        if (data.type === 'thinking_end') {
          // Thinking 종료 - 일반 로딩으로 변경
          const loadingIndex = messages.value.findIndex(m => m.content.includes('🤔 생각 중'))
          if (loadingIndex !== -1) {
            messages.value[loadingIndex].content = '답변을 생성하는 중...'
          }
        }
        
        // 일반 응답 내용
        if (data.type === 'content' && data.content) {
          // 로딩 메시지 찾기 및 제거
          const loadingIndex = messages.value.findIndex(m => m.content === '답변을 생성하는 중...')
          if (loadingIndex !== -1) {
            messages.value.splice(loadingIndex, 1)
          }
          
          // 마지막 메시지가 bot이고 아직 내용이 비어있거나 누적 중이면 업데이트
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'bot' && (lastMessage.content === '' || !lastMessage.content.includes('답변을 생성하는 중'))) {
            if (lastMessage.content === '') {
              lastMessage.content = data.content
            } else {
              lastMessage.content += data.content
            }
          } else {
            // 새 bot 메시지 추가
            messages.value.push({
              role: 'bot',
              content: data.content,
            })
          }
          await nextTick()
          scrollToBottom()
        }

        // 스트리밍 완료 신호
        if (data.type === 'end') {
          isLoading.value = false
          inputMessage.value = ''
          await nextTick()
          scrollToBottom()
        }

        // 에러 처리
        if (data.type === 'error') {
          // 로딩 메시지 제거
          const loadingIndex = messages.value.findIndex(m => m.content === '답변을 생성하는 중...')
          if (loadingIndex !== -1) {
            messages.value.splice(loadingIndex, 1)
          }
          
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'bot' && lastMessage.content === '') {
            lastMessage.content = data.content || '오류가 발생했습니다.'
          } else {
            messages.value.push({
              role: 'bot',
              content: data.content || '오류가 발생했습니다.',
            })
          }
          await nextTick()
          scrollToBottom()
          isLoading.value = false
          inputMessage.value = ''
        }
      } catch (e) {
        console.warn('JSON 파싱 오류:', e, event.data)
      }
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket 오류:', error)
      isConnected.value = false
      // HTTP Streaming으로 폴백
      if (isLoading.value) {
        fallbackToHttpStreaming()
      }
    }

    ws.value.onclose = () => {
      console.log('WebSocket 연결 종료')
      isConnected.value = false
      // 자동 재연결 시도 (5초 후)
      if (canAccess.value) {
        setTimeout(() => {
          if (!isConnected.value) {
            connectWebSocket()
          }
        }, 5000)
      }
    }
  } catch (error) {
    console.error('WebSocket 연결 실패:', error)
    isConnected.value = false
  }
}

// HTTP Streaming으로 폴백
async function fallbackToHttpStreaming() {
  const message = inputMessage.value.trim()
  if (!message) return

  try {
    const token = authStore.accessToken
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: message,
        user_id: authStore.user!.id,
        include_context: true,
        model: selectedModel.value,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 로딩 메시지 제거
    const loadingIndex = messages.value.findIndex(m => m.content === '답변을 생성하는 중...')
    if (loadingIndex !== -1) {
      messages.value.splice(loadingIndex, 1)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let botResponse = ''
    let buffer = ''
    let sentimentData: ChatMessage['sentiment'] | undefined = undefined

    const botMsgIndex = messages.value.length
    messages.value.push({
      role: 'bot',
      content: '',
    })

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)

          if (data.type === 'sentiment' && data.data) {
            sentimentData = {
              label: data.data.label || '분석 중...',
              explanation: data.data.explanation || '',
            }
            messages.value.splice(botMsgIndex, 0, {
              role: 'bot',
              content: `💭 감정 분석: ${sentimentData.label}\n${sentimentData.explanation}`,
              sentiment: sentimentData,
            })
            await nextTick()
            scrollToBottom()
          }

          if (data.type === 'content' && data.content) {
            botResponse += data.content
            messages.value[botMsgIndex + (sentimentData ? 1 : 0)].content = botResponse
            await nextTick()
            scrollToBottom()
          }

          if (data.type === 'error') {
            messages.value[botMsgIndex + (sentimentData ? 1 : 0)].content =
              data.content || '오류가 발생했습니다.'
            await nextTick()
            scrollToBottom()
            break
          }
        } catch (e) {
          console.warn('JSON 파싱 오류:', e, line)
        }
      }
    }

    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer)
        if (data.type === 'content' && data.content) {
          botResponse += data.content
          messages.value[botMsgIndex + (sentimentData ? 1 : 0)].content = botResponse
          await nextTick()
          scrollToBottom()
        }
      } catch (e) {
        console.warn('버퍼 파싱 오류:', e)
      }
    }

    scrollToBottom()
  } catch (error) {
    console.error('채팅 오류:', error)
    const loadingIndex = messages.value.findIndex(m => m.content === '답변을 생성하는 중...')
    if (loadingIndex !== -1) {
      messages.value.splice(loadingIndex, 1)
    }
    messages.value.push({
      role: 'bot',
      content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    })
    await nextTick()
    scrollToBottom()
  } finally {
    isLoading.value = false
    inputMessage.value = ''
  }
}

async function sendMessage() {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  // 사용자 메시지 추가
  messages.value.push({
    role: 'user',
    content: message,
  })

  const messageToSend = message
  inputMessage.value = ''
  isLoading.value = true

  await nextTick()
  scrollToBottom()

  // 로딩 메시지
  messages.value.push({
    role: 'bot',
    content: '답변을 생성하는 중...',
  })

  await nextTick()
  scrollToBottom()

  // WebSocket이 연결되어 있으면 WebSocket 사용, 아니면 HTTP Streaming 사용
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    try {
      // 응답을 받기 위해 bot 메시지 초기화
      const lastMessage = messages.value[messages.value.length - 1]
      if (lastMessage && lastMessage.role === 'bot' && lastMessage.content === '답변을 생성하는 중...') {
        lastMessage.content = ''
      }
      
      // WebSocket으로 메시지 전송
      ws.value.send(JSON.stringify({
        message: messageToSend,
        include_context: true,
        model: selectedModel.value,
      }))
    } catch (error) {
      console.error('WebSocket 전송 오류:', error)
      // HTTP Streaming으로 폴백
      isLoading.value = false
      await fallbackToHttpStreaming()
    }
  } else {
    // WebSocket이 연결되지 않았으면 HTTP Streaming 사용
    await fallbackToHttpStreaming()
  }
}

onMounted(() => {
  // 로그인 체크 제거됨 - 로그인 없이도 접근 가능
  // 초기 환영 메시지
  messages.value = [
    {
      role: 'bot',
      content: `안녕하세요! AI Wedding Planner OS입니다. 😊\n\n저는 당신의 캘린더, 예산서, 게시판 기록을 모두 읽어서 개인 맞춤 조언을 제공합니다.\n\n제가 할 수 있는 것들:\n• "지금까지 준비 상황 요약해줘"\n• "이번 달 예산 상황 알려줘"\n• "웨딩홀 추천해줘 (예산/지역/인원)"\n• "게시판 리뷰 요약해줘"\n• "일정에 따라 체크리스트 PDF 만들어줘"\n\n무엇을 도와드릴까요?`,
    },
  ]
  
  // WebSocket 연결
  connectWebSocket()
  
  // 저장된 메모리 로드
  loadMemories()
  
  // 모델 목록 로드
  loadModels()
})

onUnmounted(() => {
  // 컴포넌트 언마운트 시 WebSocket 연결 종료
  if (ws.value) {
    ws.value.close()
    ws.value = null
  }
})

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 메시지 저장 기능
function openSaveModal(message: ChatMessage) {
  selectedMessage.value = message
  saveTitle.value = ''
  saveTags.value = []
  tagInput.value = ''
  showSaveModal.value = true
}

function addTag() {
  if (tagInput.value.trim() && !saveTags.value.includes(tagInput.value.trim())) {
    saveTags.value.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

function removeTag(tag: string) {
  saveTags.value = saveTags.value.filter(t => t !== tag)
}

async function saveMemory() {
  if (!selectedMessage.value) return
  
  try {
    const token = authStore.accessToken
    const response = await fetch(`${API_BASE_URL}/chat-memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        content: selectedMessage.value.content,
        title: saveTitle.value || null,
        tags: saveTags.value.length > 0 ? saveTags.value : null,
        original_message: selectedMessage.value.role === 'user' ? selectedMessage.value.content : null,
        ai_response: selectedMessage.value.role === 'bot' ? selectedMessage.value.content : null,
        is_shared_with_partner: false,
      }),
    })

    if (!response.ok) {
      throw new Error('저장 실패')
    }

    // 저장 성공 표시
    if (selectedMessage.value) {
      selectedMessage.value.isSaved = true
    }
    
    showSaveModal.value = false
    await loadMemories()
  } catch (error) {
    console.error('메모리 저장 오류:', error)
    alert('저장 중 오류가 발생했습니다.')
  }
}

async function loadMemories() {
  try {
    const token = authStore.accessToken
    const response = await fetch(`${API_BASE_URL}/chat-memories`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (response.ok) {
      const data = await response.json()
      savedMemories.value = data.data || []
    }
  } catch (error) {
    console.error('메모리 로드 오류:', error)
  }
}

async function deleteMemory(memoryId: number) {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  try {
    const token = authStore.accessToken
    const response = await fetch(`${API_BASE_URL}/chat-memories/${memoryId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (response.ok) {
      await loadMemories()
    }
  } catch (error) {
    console.error('메모리 삭제 오류:', error)
  }
}

// 모델 목록 로드
async function loadModels() {
  try {
    const response = await fetch(`${API_BASE_URL}/models`)
    if (response.ok) {
      const data = await response.json()
      availableModels.value = data.data || []
      // 기본 모델 선택 (일반 상담)
      const defaultModel = availableModels.value.find((m: any) => m.id === 'gemini-2.5-flash')
      if (defaultModel) {
        selectedModel.value = defaultModel.id
      }
    }
  } catch (error) {
    console.error('모델 목록 로드 오류:', error)
  }
}

function selectModel(modelId: string) {
  selectedModel.value = modelId
  showModelSelector.value = false
}

function getSelectedModelLabel() {
  if (!selectedModel.value) return '모델 선택'
  const model = availableModels.value.find((m: any) => m.id === selectedModel.value)
  return model ? `${model.label} - ${model.name}` : '모델 선택'
}
</script>

<template>
  <section class="section" id="chat">
    <div class="chat-container">
      <div class="chat-header">
        <div>
          <h1>🤖 AI Planner Chat</h1>
          <span style="font-size: 13px; opacity: 0.8">개인 맞춤 비서</span>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
          <div class="model-selector-wrapper">
            <button
              class="model-select-btn"
              @click="showModelSelector = !showModelSelector"
              :title="getSelectedModelLabel()"
            >
              🤖 {{ getSelectedModelLabel() }}
            </button>
            <div v-if="showModelSelector" class="model-selector-dropdown">
              <div
                v-for="model in availableModels"
                :key="model.id"
                class="model-option"
                :class="{ active: selectedModel === model.id }"
                @click="selectModel(model.id)"
              >
                <div class="model-label">{{ model.label }}</div>
                <div class="model-name">{{ model.name }}</div>
                <div class="model-description">{{ model.description }}</div>
              </div>
            </div>
          </div>
          <button
            class="memories-btn"
            @click="showMemoriesList = !showMemoriesList"
            title="저장된 메모리 보기"
          >
            📚 메모리 ({{ savedMemories.length }})
          </button>
          <div class="connection-status" :class="{ connected: isConnected }">
            <span class="status-dot"></span>
            <span>{{ isConnected ? '연결됨' : '연결 중...' }}</span>
          </div>
        </div>
      </div>
      <div
        style="
          padding: 16px 20px;
          background: rgba(139, 92, 246, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 13px;
          line-height: 1.6;
        "
      >
        <div style="font-weight: 600; margin-bottom: 8px">📌 주요 기능:</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px">
          <div>• 개인 DB 기반 상담 (캘린더/예산서/게시판)</div>
          <div>• 공유 데이터 기반 정보 제공</div>
          <div>• 개인 정보 자동 정리</div>
          <div>• 웨딩홀 탐색·추천</div>
          <div>• 게시판/일정/예산 통합 관리</div>
        </div>
      </div>
      <div ref="messagesContainer" class="chat-messages">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="chat-message-wrapper"
          :class="msg.role"
        >
          <div class="chat-message" :class="msg.role">
            {{ msg.content }}
          </div>
          <button
            v-if="msg.role === 'bot' && msg.content && !msg.isSaved"
            class="save-message-btn"
            @click="openSaveModal(msg)"
            title="이 내용 저장하기"
          >
            💾 저장
          </button>
          <span v-if="msg.isSaved" class="saved-badge">✓ 저장됨</span>
        </div>
      </div>
      <div class="chat-input-area">
        <input
          v-model="inputMessage"
          type="text"
          class="chat-input"
          placeholder="메시지를 입력하세요..."
          :disabled="isLoading"
          @keypress="handleKeyPress"
        />
        <button class="chat-send" type="button" :disabled="isLoading" @click="sendMessage">
          {{ isLoading ? '전송 중...' : '전송' }}
        </button>
      </div>
    </div>

    <!-- 저장 모달 -->
    <div v-if="showSaveModal" class="modal-overlay" @click="showSaveModal = false">
      <div class="modal-content" @click.stop>
        <h3>💾 메모리 저장</h3>
        <div class="modal-body">
          <div class="form-group">
            <label>제목 (선택)</label>
            <input v-model="saveTitle" type="text" placeholder="제목을 입력하세요" />
          </div>
          <div class="form-group">
            <label>태그</label>
            <div class="tag-input-group">
              <input
                v-model="tagInput"
                type="text"
                placeholder="태그 입력 후 Enter"
                @keypress.enter="addTag"
              />
              <button @click="addTag">추가</button>
            </div>
            <div v-if="saveTags.length > 0" class="tags-list">
              <span v-for="tag in saveTags" :key="tag" class="tag-item">
                {{ tag }}
                <button @click="removeTag(tag)" class="tag-remove">×</button>
              </span>
            </div>
          </div>
          <div class="form-group">
            <label>저장할 내용</label>
            <div class="preview-content">{{ selectedMessage?.content }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showSaveModal = false" class="btn-cancel">취소</button>
          <button @click="saveMemory" class="btn-save">저장</button>
        </div>
      </div>
    </div>

    <!-- 저장된 메모리 목록 -->
    <div v-if="showMemoriesList" class="memories-sidebar">
      <div class="memories-header">
        <h3>📚 저장된 메모리</h3>
        <button @click="showMemoriesList = false" class="close-btn">×</button>
      </div>
      <div class="memories-list">
        <div v-if="savedMemories.length === 0" class="empty-state">
          저장된 메모리가 없습니다.
        </div>
        <div
          v-for="memory in savedMemories"
          :key="memory.id"
          class="memory-item"
        >
          <div class="memory-title">{{ memory.title || '제목 없음' }}</div>
          <div class="memory-content">{{ memory.content }}</div>
          <div v-if="memory.tags && memory.tags.length > 0" class="memory-tags">
            <span v-for="tag in memory.tags" :key="tag" class="tag-badge">{{ tag }}</span>
          </div>
          <div class="memory-actions">
            <button @click="deleteMemory(memory.id)" class="btn-delete">삭제</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
}

.chat-header {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #0b0d12;
  padding: 20px;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(11, 13, 18, 0.7);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 2s infinite;
}

.connection-status.connected .status-dot {
  background: #10b981;
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.chat-header h1 {
  margin: 0;
  font-size: 20px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 400px;
  max-height: calc(100vh - 300px);
}

.chat-message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.chat-message-wrapper.bot {
  align-items: flex-start;
}

.chat-message-wrapper.user {
  align-items: flex-end;
}

.chat-message {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 75%;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--text);
}

.chat-message.bot {
  background: var(--soft);
  color: var(--text);
  align-self: flex-start;
}

.chat-message.user {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #0b0d12;
  align-self: flex-end;
  font-weight: 500;
}

.chat-input-area {
  padding: 20px;
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 0;
  border-radius: 0 0 16px 16px;
  display: flex;
  gap: 8px;
}

.chat-input {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: var(--soft);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
}

.chat-input:focus {
  outline: none;
  border-color: var(--accent);
}

.chat-send {
  padding: 12px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border: 0;
  color: #0b0d12;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.chat-send:hover {
  transform: translateY(-1px);
}

.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 모바일 스타일 */
@media (max-width: 768px) {
  .section {
    padding: 16px 8px;
  }

  .chat-container {
    padding: 12px;
    max-width: 100%;
  }

  .chat-header {
    padding: 16px;
    border-radius: 12px 12px 0 0;
  }

  .chat-header h1 {
    font-size: 18px;
  }

  .chat-header > div[style*="padding"] {
    padding: 12px 16px;
    font-size: 11px;
  }

  .chat-header > div[style*="padding"] > div[style*="display: grid"] {
    grid-template-columns: 1fr;
    gap: 6px;
    font-size: 11px;
  }

  .chat-messages {
    padding: 16px;
    min-height: 300px;
    max-height: calc(100vh - 400px);
  }

  .chat-message {
    padding: 10px 12px;
    font-size: 13px;
    max-width: 85%;
    color: var(--text);
  }
  
  .chat-message.bot {
    color: var(--text);
  }

  .chat-input-area {
    padding: 16px;
    flex-direction: column;
    gap: 8px;
  }

  .chat-input {
    padding: 10px;
    font-size: 14px;
  }

  .chat-send {
    padding: 10px 20px;
    font-size: 13px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .chat-message {
    max-width: 90%;
    font-size: 12px;
    padding: 8px 10px;
    color: var(--text);
  }
  
  .chat-message.bot {
    color: var(--text);
  }

  .chat-header h1 {
    font-size: 16px;
  }
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card);
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: var(--text);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.form-group input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--soft);
  color: var(--text);
  font-size: 14px;
}

.tag-input-group {
  display: flex;
  gap: 8px;
}

.tag-input-group input {
  flex: 1;
}

.tag-input-group button {
  padding: 10px 16px;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  color: #0b0d12;
  font-weight: 600;
  cursor: pointer;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 6px;
  font-size: 12px;
  color: var(--accent);
}

.tag-remove {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content {
  padding: 12px;
  background: var(--soft);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel,
.btn-save {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--soft);
  color: var(--text);
}

.btn-save {
  background: var(--accent);
  color: #0b0d12;
}

/* 메모리 사이드바 */
.memories-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  background: var(--card);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 999;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
}

.memories-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.memories-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: var(--soft);
}

.memories-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.memory-item {
  padding: 16px;
  background: var(--soft);
  border-radius: 12px;
  margin-bottom: 12px;
}

.memory-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
  margin-bottom: 8px;
}

.memory-content {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin-bottom: 8px;
  white-space: pre-wrap;
  max-height: 100px;
  overflow-y: auto;
}

.memory-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag-badge {
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: var(--accent);
}

.memory-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-delete {
  padding: 4px 12px;
  font-size: 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.3);
}

@media (max-width: 768px) {
  .memories-sidebar {
    width: 100%;
  }
}

/* 모델 선택기 스타일 */
.model-selector-wrapper {
  position: relative;
}

.model-select-btn {
  padding: 6px 12px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #0b0d12;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-select-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.model-selector-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 280px;
  max-height: 400px;
  overflow-y: auto;
}

[data-theme="dark"] .model-selector-dropdown {
  background: var(--card) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.model-option {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  color: #000000 !important;
}

[data-theme="dark"] .model-option {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text) !important;
}

.model-option:last-child {
  border-bottom: none;
}

.model-option:hover {
  background: var(--soft);
}

.model-option.active {
  background: rgba(139, 92, 246, 0.2);
  border-left: 3px solid var(--accent);
}

.model-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--accent) !important;
  margin-bottom: 4px;
}

.model-name {
  font-size: 13px;
  color: var(--text) !important;
  margin-bottom: 4px;
  font-weight: 500;
}

.model-description {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.6) !important;
  line-height: 1.4;
}

/* 다크 모드 대응 */
[data-theme="dark"] .model-label {
  color: var(--accent) !important;
}

[data-theme="dark"] .model-name {
  color: var(--text) !important;
}

[data-theme="dark"] .model-description {
  color: rgba(255, 255, 255, 0.7) !important;
}

@media (max-width: 768px) {
  .model-select-btn {
    font-size: 11px;
    padding: 5px 10px;
    max-width: 150px;
  }
  
  .model-selector-dropdown {
    min-width: 240px;
    max-height: 300px;
  }
}
</style>
