<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/config/env'

interface ChatMessage {
  role: 'user' | 'bot'
  content: string
  sentiment?: {
    label: string
    explanation: string
  }
}

const authStore = useAuthStore()
const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLDivElement | null>(null)

const canAccess = computed(() => authStore.isAuthenticated)

onMounted(() => {
  if (!canAccess.value) {
    authStore.openLoginModal()
    return
  }
  // 초기 환영 메시지
  messages.value = [
    {
      role: 'bot',
      content: `안녕하세요! AI Wedding Planner OS입니다. 😊\n\n저는 당신의 캘린더, 예산서, 게시판 기록을 모두 읽어서 개인 맞춤 조언을 제공합니다.\n\n제가 할 수 있는 것들:\n• "지금까지 준비 상황 요약해줘"\n• "이번 달 예산 상황 알려줘"\n• "웨딩홀 추천해줘 (예산/지역/인원)"\n• "게시판 리뷰 요약해줘"\n• "일정에 따라 체크리스트 PDF 만들어줘"\n\n무엇을 도와드릴까요?`,
    },
  ]
})

async function sendMessage() {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  // 사용자 메시지 추가
  messages.value.push({
    role: 'user',
    content: message,
  })

  inputMessage.value = ''
  isLoading.value = true

  await nextTick()
  scrollToBottom()

  // 로딩 메시지
  const loadingMsgIndex = messages.value.length
  messages.value.push({
    role: 'bot',
    content: '답변을 생성하는 중...',
  })

  await nextTick()
  scrollToBottom()

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
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 로딩 메시지 제거
    messages.value.splice(loadingMsgIndex, 1)

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

          // 감정 분석 결과
          if (data.type === 'sentiment' && data.data) {
            sentimentData = {
              label: data.data.label || '분석 중...',
              explanation: data.data.explanation || '',
            }
            // 감정 분석 메시지 추가
            messages.value.splice(botMsgIndex, 0, {
              role: 'bot',
              content: `💭 감정 분석: ${sentimentData.label}\n${sentimentData.explanation}`,
            })
            await nextTick()
            scrollToBottom()
          }

          // 일반 응답 내용
          if (data.type === 'content' && data.content) {
            botResponse += data.content
            messages.value[botMsgIndex + (sentimentData ? 1 : 0)].content = botResponse
            await nextTick()
            scrollToBottom()
          }

          // 에러 처리
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

    // 버퍼에 남은 데이터 처리
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
    // 로딩 메시지 제거
    if (messages.value[loadingMsgIndex]?.content === '답변을 생성하는 중...') {
      messages.value.splice(loadingMsgIndex, 1)
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
</script>

<template>
  <section class="section" id="chat">
    <div class="chat-container">
      <div class="chat-header">
        <h1>🤖 AI Planner Chat</h1>
        <span style="font-size: 13px; opacity: 0.8">개인 맞춤 비서</span>
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
          class="chat-message"
          :class="msg.role"
        >
          {{ msg.content }}
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

.chat-message {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 75%;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.chat-message.bot {
  background: var(--soft);
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
</style>
