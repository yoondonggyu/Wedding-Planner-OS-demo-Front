import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { API_BASE_URL } from '@/config/env'
import clsx from 'clsx'
import './ChatView.css'

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

interface Memory {
  id: number
  title?: string
  content: string
  tags?: string[]
}

interface Model {
  id: string
  label: string
  name: string
  description: string
}

export default function ChatView() {
  const authStore = useAuthStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveTags, setSaveTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [savedMemories, setSavedMemories] = useState<Memory[]>([])
  const [showMemoriesList, setShowMemoriesList] = useState(false)
  const [availableModels, setAvailableModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [showModelSelector, setShowModelSelector] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const modelSelectorRef = useRef<HTMLDivElement>(null)

  const canAccess = useMemo(() => true, [])

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  const connectWebSocket = useCallback(() => {
    if (!authStore.accessToken || !authStore.user) {
      return
    }

    try {
      let wsBaseUrl = API_BASE_URL
      if (wsBaseUrl.startsWith('http://')) {
        wsBaseUrl = wsBaseUrl.replace('http://', 'ws://')
      } else if (wsBaseUrl.startsWith('https://')) {
        wsBaseUrl = wsBaseUrl.replace('https://', 'wss://')
      } else {
        wsBaseUrl = 'ws://localhost:8101/api'
      }
      const wsEndpoint = `${wsBaseUrl}/chat/ws?token=${encodeURIComponent(authStore.accessToken)}`

      console.log('WebSocket 연결 시도:', wsEndpoint.replace(authStore.accessToken, 'TOKEN'))
      const ws = new WebSocket(wsEndpoint)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket 연결 성공')
        setIsConnected(true)
      }

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'sentiment' && data.data) {
            const sentimentData = {
              label: data.data.label || '분석 중...',
              explanation: data.data.explanation || '',
            }
            setMessages((prev) => {
              const botMsgIndex = prev.length
              const newMessages = [...prev]
              newMessages.splice(botMsgIndex, 0, {
                role: 'bot',
                content: `💭 감정 분석: ${sentimentData.label}\n${sentimentData.explanation}`,
                sentiment: sentimentData,
              })
              return newMessages
            })
            setTimeout(scrollToBottom, 0)
          }

          if (data.type === 'thinking_start') {
            setMessages((prev) =>
              prev.map((m, idx) =>
                idx === prev.findIndex((msg) => msg.content === '답변을 생성하는 중...')
                  ? { ...m, content: '🤔 생각 중...' }
                  : m
              )
            )
          }

          if (data.type === 'thinking_end') {
            setMessages((prev) =>
              prev.map((m) =>
                m.content.includes('🤔 생각 중')
                  ? { ...m, content: '답변을 생성하는 중...' }
                  : m
              )
            )
          }

          if (data.type === 'content' && data.content) {
            setMessages((prev) => {
              const loadingIndex = prev.findIndex((m) => m.content === '답변을 생성하는 중...')
              if (loadingIndex !== -1) {
                const newMessages = [...prev]
                newMessages.splice(loadingIndex, 1)
                prev = newMessages
              }

              const lastMessage = prev[prev.length - 1]
              if (lastMessage && lastMessage.role === 'bot' && lastMessage.content !== '' && !lastMessage.content.includes('답변을 생성하는 중')) {
                return prev.map((m, idx) =>
                  idx === prev.length - 1 ? { ...m, content: m.content + data.content } : m
                )
              } else {
                return [...prev, { role: 'bot', content: data.content }]
              }
            })
            setTimeout(scrollToBottom, 0)
          }

          if (data.type === 'end') {
            setIsLoading(false)
            setInputMessage('')
            setTimeout(scrollToBottom, 0)
          }

          if (data.type === 'error') {
            setMessages((prev) => {
              const loadingIndex = prev.findIndex((m) => m.content === '답변을 생성하는 중...')
              if (loadingIndex !== -1) {
                const newMessages = [...prev]
                newMessages.splice(loadingIndex, 1)
                prev = newMessages
              }

              const lastMessage = prev[prev.length - 1]
              if (lastMessage && lastMessage.role === 'bot' && lastMessage.content === '') {
                return prev.map((m, idx) =>
                  idx === prev.length - 1 ? { ...m, content: data.content || '오류가 발생했습니다.' } : m
                )
              } else {
                return [...prev, { role: 'bot', content: data.content || '오류가 발생했습니다.' }]
              }
            })
            setTimeout(scrollToBottom, 0)
            setIsLoading(false)
            setInputMessage('')
          }
        } catch (e) {
          console.warn('JSON 파싱 오류:', e, event.data)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error)
        setIsConnected(false)
        if (isLoading) {
          fallbackToHttpStreaming()
        }
      }

      ws.onclose = () => {
        console.log('WebSocket 연결 종료')
        setIsConnected(false)
        if (canAccess) {
          setTimeout(() => {
            if (!isConnected) {
              connectWebSocket()
            }
          }, 5000)
        }
      }
    } catch (error) {
      console.error('WebSocket 연결 실패:', error)
      setIsConnected(false)
    }
  }, [authStore.accessToken, authStore.user, isLoading, isConnected, canAccess, scrollToBottom])

  const fallbackToHttpStreaming = useCallback(async () => {
    const message = inputMessage.trim()
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
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setMessages((prev) => {
        const loadingIndex = prev.findIndex((m) => m.content === '답변을 생성하는 중...')
        if (loadingIndex !== -1) {
          const newMessages = [...prev]
          newMessages.splice(loadingIndex, 1)
          return newMessages
        }
        return prev
      })

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let botResponse = ''
      let buffer = ''
      let sentimentData: ChatMessage['sentiment'] | undefined = undefined

      const botMsgIndex = messages.length
      setMessages((prev) => [...prev, { role: 'bot', content: '' }])

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
              setMessages((prev) => {
                const newMessages = [...prev]
                newMessages.splice(botMsgIndex, 0, {
                  role: 'bot',
                  content: `💭 감정 분석: ${sentimentData!.label}\n${sentimentData!.explanation}`,
                  sentiment: sentimentData,
                })
                return newMessages
              })
              setTimeout(scrollToBottom, 0)
            }

            if (data.type === 'content' && data.content) {
              botResponse += data.content
              setMessages((prev) => {
                const newMessages = [...prev]
                const targetIndex = botMsgIndex + (sentimentData ? 1 : 0)
                if (newMessages[targetIndex]) {
                  newMessages[targetIndex] = { ...newMessages[targetIndex], content: botResponse }
                }
                return newMessages
              })
              setTimeout(scrollToBottom, 0)
            }

            if (data.type === 'error') {
              setMessages((prev) => {
                const newMessages = [...prev]
                const targetIndex = botMsgIndex + (sentimentData ? 1 : 0)
                if (newMessages[targetIndex]) {
                  newMessages[targetIndex] = {
                    ...newMessages[targetIndex],
                    content: data.content || '오류가 발생했습니다.',
                  }
                }
                return newMessages
              })
              setTimeout(scrollToBottom, 0)
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
            setMessages((prev) => {
              const newMessages = [...prev]
              const targetIndex = botMsgIndex + (sentimentData ? 1 : 0)
              if (newMessages[targetIndex]) {
                newMessages[targetIndex] = { ...newMessages[targetIndex], content: botResponse }
              }
              return newMessages
            })
            setTimeout(scrollToBottom, 0)
          }
        } catch (e) {
          console.warn('버퍼 파싱 오류:', e)
        }
      }

      scrollToBottom()
    } catch (error) {
      console.error('채팅 오류:', error)
      setMessages((prev) => {
        const loadingIndex = prev.findIndex((m) => m.content === '답변을 생성하는 중...')
        if (loadingIndex !== -1) {
          const newMessages = [...prev]
          newMessages.splice(loadingIndex, 1)
          return newMessages
        }
        return prev
      })
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
      ])
      setTimeout(scrollToBottom, 0)
    } finally {
      setIsLoading(false)
      setInputMessage('')
    }
  }, [inputMessage, authStore.accessToken, authStore.user, selectedModel, messages.length, scrollToBottom])

  const sendMessage = useCallback(async () => {
    const message = inputMessage.trim()
    if (!message || isLoading) return

    setMessages((prev) => [...prev, { role: 'user', content: message }])
    const messageToSend = message
    setInputMessage('')
    setIsLoading(true)

    setTimeout(scrollToBottom, 0)

    setMessages((prev) => [...prev, { role: 'bot', content: '답변을 생성하는 중...' }])
    setTimeout(scrollToBottom, 0)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === prev.length - 1 && m.role === 'bot' && m.content === '답변을 생성하는 중...'
              ? { ...m, content: '' }
              : m
          )
        )

        wsRef.current.send(
          JSON.stringify({
            message: messageToSend,
            include_context: true,
            model: selectedModel,
          })
        )
      } catch (error) {
        console.error('WebSocket 전송 오류:', error)
        setIsLoading(false)
        await fallbackToHttpStreaming()
      }
    } else {
      await fallbackToHttpStreaming()
    }
  }, [inputMessage, isLoading, selectedModel, scrollToBottom, fallbackToHttpStreaming])

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  const openSaveModal = useCallback((message: ChatMessage) => {
    setSelectedMessage(message)
    setSaveTitle('')
    setSaveTags([])
    setTagInput('')
    setShowSaveModal(true)
  }, [])

  const addTag = useCallback(() => {
    if (tagInput.trim() && !saveTags.includes(tagInput.trim())) {
      setSaveTags((prev) => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }, [tagInput, saveTags])

  const removeTag = useCallback((tag: string) => {
    setSaveTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const saveMemory = useCallback(async () => {
    if (!selectedMessage) return

    try {
      const token = authStore.accessToken
      const response = await fetch(`${API_BASE_URL}/chat-memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: selectedMessage.content,
          title: saveTitle || null,
          tags: saveTags.length > 0 ? saveTags : null,
          original_message: selectedMessage.role === 'user' ? selectedMessage.content : null,
          ai_response: selectedMessage.role === 'bot' ? selectedMessage.content : null,
          is_shared_with_partner: false,
        }),
      })

      if (!response.ok) {
        throw new Error('저장 실패')
      }

      setMessages((prev) =>
        prev.map((m) => (m === selectedMessage ? { ...m, isSaved: true } : m))
      )

      setShowSaveModal(false)
      await loadMemories()
    } catch (error) {
      console.error('메모리 저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }, [selectedMessage, saveTitle, saveTags, authStore.accessToken])

  const loadMemories = useCallback(async () => {
    try {
      const token = authStore.accessToken
      const response = await fetch(`${API_BASE_URL}/chat-memories`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSavedMemories(data.data || [])
      }
    } catch (error) {
      console.error('메모리 로드 오류:', error)
    }
  }, [authStore.accessToken])

  const deleteMemory = useCallback(
    async (memoryId: number) => {
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
    },
    [authStore.accessToken, loadMemories]
  )

  const loadModels = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/models`)
      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.data || [])
        const defaultModel = data.data?.find((m: Model) => m.id === 'gemini-2.5-flash')
        if (defaultModel) {
          setSelectedModel(defaultModel.id)
        }
      }
    } catch (error) {
      console.error('모델 목록 로드 오류:', error)
    }
  }, [])

  const selectModel = useCallback((modelId: string) => {
    setSelectedModel(modelId)
    setShowModelSelector(false)
  }, [])

  const getSelectedModelLabel = useCallback(() => {
    if (!selectedModel) return '모델 선택'
    const model = availableModels.find((m) => m.id === selectedModel)
    return model ? `${model.label} - ${model.name}` : '모델 선택'
  }, [selectedModel, availableModels])

  // 외부 클릭 감지로 모델 선택기 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelSelectorRef.current &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModelSelector(false)
      }
    }

    if (showModelSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModelSelector])

  useEffect(() => {
    setMessages([
      {
        role: 'bot',
        content: `안녕하세요! AI Wedding Planner OS입니다. 😊\n\n저는 당신의 캘린더, 예산서, 게시판 기록을 모두 읽어서 개인 맞춤 조언을 제공합니다.\n\n제가 할 수 있는 것들:\n• "지금까지 준비 상황 요약해줘"\n• "이번 달 예산 상황 알려줘"\n• "웨딩홀 추천해줘 (예산/지역/인원)"\n• "게시판 리뷰 요약해줘"\n• "일정에 따라 체크리스트 PDF 만들어줘"\n\n무엇을 도와드릴까요?`,
      },
    ])

    connectWebSocket()
    loadMemories()
    loadModels()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connectWebSocket, loadMemories, loadModels])

  return (
    <section className="section" id="chat">
      <div className="chat-container">
        <div className="chat-header">
          <div>
            <h1>🤖 AI Planner Chat</h1>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>개인 맞춤 비서</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="model-selector-wrapper" ref={modelSelectorRef}>
              <button
                className="model-select-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowModelSelector(!showModelSelector)
                }}
                title={getSelectedModelLabel()}
              >
                🤖 {getSelectedModelLabel()}
              </button>
              {showModelSelector && (
                <div className="model-selector-dropdown" onClick={(e) => e.stopPropagation()}>
                  {availableModels.length === 0 ? (
                    <div className="model-option" style={{ color: '#666', cursor: 'default' }}>
                      모델을 불러오는 중...
                    </div>
                  ) : (
                    availableModels.map((model) => (
                      <div
                        key={model.id}
                        className={clsx('model-option', { active: selectedModel === model.id })}
                        onClick={(e) => {
                          e.stopPropagation()
                          selectModel(model.id)
                        }}
                      >
                        <div className="model-label">{model.label}</div>
                        <div className="model-name">{model.name}</div>
                        <div className="model-description">{model.description}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              className="memories-btn"
              onClick={() => setShowMemoriesList(!showMemoriesList)}
              title="저장된 메모리 보기"
            >
              📚 메모리 ({savedMemories.length})
            </button>
            <div className={clsx('connection-status', { connected: isConnected })}>
              <span className="status-dot"></span>
              <span>{isConnected ? '연결됨' : '연결 중...'}</span>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>📌 주요 기능:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
            <div>• 개인 DB 기반 상담 (캘린더/예산서/게시판)</div>
            <div>• 공유 데이터 기반 정보 제공</div>
            <div>• 개인 정보 자동 정리</div>
            <div>• 웨딩홀 탐색·추천</div>
            <div>• 게시판/일정/예산 통합 관리</div>
          </div>
        </div>
        <div ref={messagesContainerRef} className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={clsx('chat-message-wrapper', msg.role)}>
              <div className={clsx('chat-message', msg.role)}>{msg.content}</div>
              {msg.role === 'bot' && msg.content && !msg.isSaved && (
                <button className="save-message-btn" onClick={() => openSaveModal(msg)} title="이 내용 저장하기">
                  💾 저장
                </button>
              )}
              {msg.isSaved && <span className="saved-badge">✓ 저장됨</span>}
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            type="text"
            className="chat-input"
            placeholder="메시지를 입력하세요..."
            disabled={isLoading}
            onKeyPress={handleKeyPress}
          />
          <button className="chat-send" type="button" disabled={isLoading} onClick={sendMessage}>
            {isLoading ? '전송 중...' : '전송'}
          </button>
        </div>
      </div>

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>💾 메모리 저장</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>제목 (선택)</label>
                <input
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  type="text"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>태그</label>
                <div className="tag-input-group">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    type="text"
                    placeholder="태그 입력 후 Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <button onClick={addTag}>추가</button>
                </div>
                {saveTags.length > 0 && (
                  <div className="tags-list">
                    {saveTags.map((tag) => (
                      <span key={tag} className="tag-item">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="tag-remove">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>저장할 내용</label>
                <div className="preview-content">{selectedMessage?.content}</div>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowSaveModal(false)} className="btn-cancel">
                취소
              </button>
              <button onClick={saveMemory} className="btn-save">
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 저장된 메모리 목록 */}
      {showMemoriesList && (
        <div className="memories-sidebar">
          <div className="memories-header">
            <h3>📚 저장된 메모리</h3>
            <button onClick={() => setShowMemoriesList(false)} className="close-btn">
              ×
            </button>
          </div>
          <div className="memories-list">
            {savedMemories.length === 0 ? (
              <div className="empty-state">저장된 메모리가 없습니다.</div>
            ) : (
              savedMemories.map((memory) => (
                <div key={memory.id} className="memory-item">
                  <div className="memory-title">{memory.title || '제목 없음'}</div>
                  <div className="memory-content">{memory.content}</div>
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="memory-tags">
                      {memory.tags.map((tag) => (
                        <span key={tag} className="tag-badge">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="memory-actions">
                    <button onClick={() => deleteMemory(memory.id)} className="btn-delete">
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}
