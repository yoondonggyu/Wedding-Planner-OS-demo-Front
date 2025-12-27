import React, { useState, useRef, useCallback } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import clsx from 'clsx'
import './VoiceView.css'

interface OrganizedItem {
  type: 'budget_item' | 'todo' | 'post' | 'calendar_event'
  title?: string
  item_name?: string
  amount?: number
  date?: string
}

export default function VoiceView() {
  const authStore = useAuthStore()
  const { request } = useApi()

  const [isRecording, setIsRecording] = useState(false)
  const [recordStatus, setRecordStatus] = useState('마이크 버튼을 눌러 음성을 입력하세요')
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const [transcriptionText, setTranscriptionText] = useState('')
  const [organizedItems, setOrganizedItems] = useState<OrganizedItem[]>([])
  const [responseText, setResponseText] = useState('')

  const [showTranscription, setShowTranscription] = useState(false)
  const [showOrganized, setShowOrganized] = useState(false)
  const [showResponse, setShowResponse] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const toggleRecording = useCallback(async () => {
    if (!isRecording) {
      await startRecording()
    } else {
      stopRecording()
    }
  }, [isRecording])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordStatus('🎙️ 녹음 중... (다시 클릭하여 중지)')
    } catch (error) {
      console.error('마이크 접근 실패:', error)
      alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordStatus('⏳ 처리 중...')
    }
  }, [isRecording])

  const processAudio = useCallback(async (audioBlob: Blob) => {
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
  }, [])

  const processText = useCallback(async () => {
    const text = textInput.trim()
    if (!text || isProcessing) return

    setRecordStatus('⏳ 처리 중...')
    setIsProcessing(true)
    setTextInput('')

    await processVoice(null, text)
  }, [textInput, isProcessing])

  const processVoice = useCallback(
    async (audioData: string | null, text: string | null) => {
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

          setTranscriptionText(transcribed || '(전사 실패)')
          setShowTranscription(true)

          if (res.data.organized_items && res.data.organized_items.length > 0) {
            setOrganizedItems(res.data.organized_items)
            setShowOrganized(true)
          } else {
            setShowOrganized(false)
          }

          if (res.data.intent === 'query') {
            await generateResponse(transcribed)
          } else {
            setShowResponse(false)
          }

          resetRecordingState()
          setIsProcessing(false)
        } else {
          throw new Error('처리 실패')
        }
      } catch (error) {
        console.error('음성 처리 오류:', error)
        alert('음성 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
        resetRecordingState()
        setIsProcessing(false)
      }
    },
    [authStore.user, request]
  )

  const resetRecordingState = useCallback(() => {
    setRecordStatus('✅ 처리 완료! 다시 녹음하려면 버튼을 클릭하세요.')
  }, [])

  const formatCurrency = useCallback((amount?: number) => {
    if (!amount) return '0원'
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
  }, [])

  const getItemIcon = useCallback((type: string) => {
    const icons: Record<string, string> = {
      budget_item: '💰',
      todo: '✅',
      post: '📝',
      calendar_event: '📅',
    }
    return icons[type] || '📋'
  }, [])

  const getItemTypeName = useCallback((type: string) => {
    const names: Record<string, string> = {
      budget_item: '예산 항목',
      todo: '할일',
      post: '게시글',
      calendar_event: '캘린더 일정',
    }
    return names[type] || '항목'
  }, [])

  const getItemDescription = useCallback(
    (item: OrganizedItem) => {
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
    },
    [formatCurrency]
  )

  const generateResponse = useCallback(
    async (query: string) => {
      try {
        const res = await request<{ message: string; data: { response: string } }>(
          `/voice/response?query=${encodeURIComponent(query)}&user_id=${authStore.user!.id}`,
          { method: 'GET' }
        )

        if (res.message === 'voice_response_generated') {
          setResponseText(res.data.response)
          setShowResponse(true)
        }
      } catch (error) {
        console.error('답변 생성 오류:', error)
        setShowResponse(false)
      }
    },
    [authStore.user, request]
  )

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        processText()
      }
    },
    [processText]
  )

  return (
    <section className="section" id="voice">
      <div className="container">
        <div className="page-title">
          <h1>🎤 음성 비서</h1>
          <p>STT + LLM + 자동 정리 파이프라인 - 핸즈프리 웨딩 플래너</p>
        </div>

        <div className="card">
          <div className="voice-interface">
            {/* 음성 녹음 버튼 */}
            <div className="record-button-container">
              <button
                className={clsx('record-button', { recording: isRecording })}
                type="button"
                onClick={toggleRecording}
                disabled={isProcessing}
                title="마이크 버튼을 눌러 음성을 입력하세요"
              >
                🎤
              </button>
            </div>
            <div className={clsx('record-status', { recording: isRecording, processing: isProcessing })}>
              {recordStatus}
            </div>

            {/* 텍스트 직접 입력 */}
            <div className="text-input-section">
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>
                또는 직접 텍스트로 입력
              </div>
              <div className="text-input-area">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  type="text"
                  className="text-input"
                  placeholder="예: 다음 주 토요일에 스튜디오 투어 일정 잡아줘"
                  disabled={isProcessing}
                  onKeyPress={handleKeyPress}
                />
                <button className="btn primary" type="button" disabled={isProcessing} onClick={processText}>
                  처리
                </button>
              </div>
            </div>

            {/* 결과 표시 영역 */}
            {(showTranscription || showOrganized || showResponse) && (
              <div className="result-section">
                {/* 전사 결과 */}
                {showTranscription && (
                  <div className="result-card">
                    <h4>📝 전사 결과</h4>
                    <div className="result-text">{transcriptionText}</div>
                  </div>
                )}

                {/* 자동 정리 결과 */}
                {showOrganized && organizedItems.length > 0 && (
                  <div className="result-card">
                    <h4>✨ 자동 정리 결과</h4>
                    <div className="organized-items">
                      {organizedItems.map((item, idx) => (
                        <div key={idx} className="organized-item">
                          <div className="organized-item-icon">{getItemIcon(item.type)}</div>
                          <div className="organized-item-content">
                            <div className="organized-item-title">{getItemTypeName(item.type)} 생성됨</div>
                            <div className="organized-item-desc">{getItemDescription(item)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 답변 */}
                {showResponse && (
                  <div className="result-card">
                    <h4>💬 답변</h4>
                    <div className="result-text">{responseText}</div>
                  </div>
                )}
              </div>
            )}

            {/* 예시 명령어 */}
            <div className="example-commands">
              <h4>💡 사용 예시</h4>
              <ul className="example-list">
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
  )
}
