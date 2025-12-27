import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import './DigitalInvitationView.css'

interface GuestMessage {
  id: number
  guest_name: string
  message?: string
  image_url?: string
  created_at: string
}

export default function DigitalInvitationView() {
  const { url } = useParams<{ url: string }>()
  const { request } = useApi()
  const { showToast } = useToast()

  const [invitation, setInvitation] = useState<any>(null)
  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showRSVPModal, setShowRSVPModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)

  const [rsvpForm, setRsvpForm] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    status: 'ATTENDING' as 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE',
    plus_one: false,
    plus_one_name: '',
    dietary_restrictions: '',
    special_requests: '',
  })

  const [paymentForm, setPaymentForm] = useState({
    payer_name: '',
    payer_phone: '',
    amount: 0,
    payment_method: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'KAKAO_PAY' | 'TOSS' | 'CREDIT_CARD',
    payer_message: '',
  })

  const [messageForm, setMessageForm] = useState({
    guest_name: '',
    guest_phone: '',
    message: '',
    image_url: '',
  })

  const [submittingRSVP, setSubmittingRSVP] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [submittingMessage, setSubmittingMessage] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)

  const fetchInvitation = async () => {
    if (!url) {
      setError('초대장 URL이 없습니다.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await request<{
        message: string
        data: any
      }>(`/digital-invitations/${url}`, {
        method: 'GET',
      })
      setInvitation(res.data)

      if (res.data.id) {
        await fetchGuestMessages()
      }
    } catch (err: any) {
      console.error('초대장 로드 실패:', err)
      setError(err?.data?.error || err?.message || '초대장을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchGuestMessages = async () => {
    if (!invitation || !invitation.id) return

    try {
      const res = await request<{
        message: string
        data: { messages: GuestMessage[] }
      }>(`/digital-invitations/${invitation.id}/guest-messages`, {
        method: 'GET',
      })
      setGuestMessages(res.data.messages || [])
    } catch (err: any) {
      console.error('메시지 로드 실패:', err)
    }
  }

  const submitRSVP = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (!invitation) return

    setSubmittingRSVP(true)
    try {
      await request(`/digital-invitations/${invitation.id}/rsvps`, {
        method: 'POST',
        body: {
          invitation_id: invitation.id,
          ...rsvpForm,
        },
      })
      showToast('참석 여부가 등록되었습니다.', 'success')
      setShowRSVPModal(false)
      setRsvpForm({
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        status: 'ATTENDING',
        plus_one: false,
        plus_one_name: '',
        dietary_restrictions: '',
        special_requests: '',
      })
    } catch (err: any) {
      console.error('RSVP 제출 실패:', err)
      showToast(err?.data?.error || err?.message || '참석 여부 등록에 실패했습니다.', 'error')
    } finally {
      setSubmittingRSVP(false)
    }
  }

  const submitPayment = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (!invitation) return

    setSubmittingPayment(true)
    try {
      await request(`/digital-invitations/${invitation.id}/payments`, {
        method: 'POST',
        body: {
          invitation_id: invitation.id,
          ...paymentForm,
        },
      })
      showToast('축의금 결제가 완료되었습니다.', 'success')
      setShowPaymentModal(false)
      setPaymentForm({
        payer_name: '',
        payer_phone: '',
        amount: 0,
        payment_method: 'BANK_TRANSFER',
        payer_message: '',
      })
    } catch (err: any) {
      console.error('결제 실패:', err)
      showToast(err?.data?.error || err?.message || '결제에 실패했습니다.', 'error')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const submitMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (!invitation) return

    setSubmittingMessage(true)
    try {
      await request(`/digital-invitations/${invitation.id}/guest-messages`, {
        method: 'POST',
        body: {
          invitation_id: invitation.id,
          ...messageForm,
        },
      })
      showToast('축하 메시지가 등록되었습니다.', 'success')
      setShowMessageModal(false)
      setMessageForm({
        guest_name: '',
        guest_phone: '',
        message: '',
        image_url: '',
      })
      await fetchGuestMessages()
    } catch (err: any) {
      console.error('메시지 전송 실패:', err)
      showToast(err?.data?.error || err?.message || '메시지 전송에 실패했습니다.', 'error')
    } finally {
      setSubmittingMessage(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setMessageForm({ ...messageForm, image_url: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }

  useEffect(() => {
    fetchInvitation()
  }, [url])

  useEffect(() => {
    if (invitation?.id) {
      fetchGuestMessages()
    }
  }, [invitation?.id])

  if (loading) {
    return (
      <div className="digital-invitation-view">
        <div className="loading">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="digital-invitation-view">
        <div className="error">{error}</div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  return (
    <div className="digital-invitation-view">
      {/* 디지털 초대장 페이지 (공개 접근) */}
      <div className="invitation-page">
        <div className={`invitation-header theme-${invitation.theme}`}>
          <h1 className="couple-names">
            {invitation.groom_name} · {invitation.bride_name}
          </h1>
          <p className="wedding-date">
            {formatDate(invitation.wedding_date)} {invitation.wedding_time || ''}
          </p>
        </div>

        <div className="invitation-content">
          <div className="section">
            <h2>💒 예식 안내</h2>
            <p>
              <strong>장소:</strong> {invitation.wedding_location}
            </p>
            {invitation.wedding_location_detail && <p>{invitation.wedding_location_detail}</p>}
            {invitation.map_url && (
              <div className="map-link">
                <a href={invitation.map_url} target="_blank" rel="noopener noreferrer">
                  📍 지도 보기
                </a>
              </div>
            )}
            {invitation.parking_info && (
              <div className="parking-info">
                <p>
                  <strong>주차 안내:</strong> {invitation.parking_info}
                </p>
              </div>
            )}
          </div>

          <div className="actions-section">
            <button className="action-btn primary" onClick={() => setShowRSVPModal(true)}>
              📝 참석 여부 알려주기
            </button>
            <button className="action-btn secondary" onClick={() => setShowPaymentModal(true)}>
              💰 축의금 보내기
            </button>
            <button className="action-btn secondary" onClick={() => setShowMessageModal(true)}>
              💌 축하 메시지 남기기
            </button>
          </div>

          <div className="section">
            <h2>💬 축하 메시지</h2>
            {guestMessages.length === 0 ? (
              <div className="empty-state">아직 축하 메시지가 없습니다.</div>
            ) : (
              <div className="messages-list">
                {guestMessages.map((msg) => (
                  <div key={msg.id} className="message-item">
                    <div className="message-header">
                      <strong>{msg.guest_name}</strong>
                      <span className="message-date">{formatDate(msg.created_at)}</span>
                    </div>
                    {msg.message && <p>{msg.message}</p>}
                    {msg.image_url && <img src={msg.image_url} alt="축하 사진" className="message-image" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RSVP 모달 */}
      {showRSVPModal && (
        <div className="modal-overlay" onClick={() => setShowRSVPModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>참석 여부 알려주기</h2>
            <form onSubmit={submitRSVP}>
              <div className="form-group">
                <label>이름 *</label>
                <input
                  value={rsvpForm.guest_name}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, guest_name: e.target.value })}
                  type="text"
                  required
                />
              </div>
              <div className="form-group">
                <label>전화번호</label>
                <input
                  value={rsvpForm.guest_phone}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, guest_phone: e.target.value })}
                  type="tel"
                />
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input
                  value={rsvpForm.guest_email}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, guest_email: e.target.value })}
                  type="email"
                />
              </div>
              <div className="form-group">
                <label>참석 여부 *</label>
                <select
                  value={rsvpForm.status}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, status: e.target.value as any })}
                  required
                >
                  <option value="ATTENDING">참석합니다</option>
                  <option value="NOT_ATTENDING">불참합니다</option>
                  <option value="MAYBE">미정입니다</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={rsvpForm.plus_one}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, plus_one: e.target.checked })}
                  />
                  동반자와 함께 참석합니다
                </label>
                {rsvpForm.plus_one && (
                  <input
                    value={rsvpForm.plus_one_name}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, plus_one_name: e.target.value })}
                    type="text"
                    placeholder="동반자 이름"
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="form-group">
                <label>식이 제한사항 (알레르기 등)</label>
                <textarea
                  value={rsvpForm.dietary_restrictions}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, dietary_restrictions: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>특별 요청사항</label>
                <textarea
                  value={rsvpForm.special_requests}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, special_requests: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRSVPModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary" disabled={submittingRSVP}>
                  {submittingRSVP ? '제출 중...' : '제출'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 결제 모달 */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>축의금 보내기</h2>
            <form onSubmit={submitPayment}>
              <div className="form-group">
                <label>보내는 분 이름 *</label>
                <input
                  value={paymentForm.payer_name}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payer_name: e.target.value })}
                  type="text"
                  required
                />
              </div>
              <div className="form-group">
                <label>전화번호</label>
                <input
                  value={paymentForm.payer_phone}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payer_phone: e.target.value })}
                  type="tel"
                />
              </div>
              <div className="form-group">
                <label>금액 *</label>
                <input
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  type="number"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>결제 방법 *</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as any })}
                  required
                >
                  <option value="BANK_TRANSFER">계좌이체</option>
                  <option value="KAKAO_PAY">카카오페이</option>
                  <option value="TOSS">토스</option>
                  <option value="CREDIT_CARD">신용카드</option>
                </select>
              </div>
              <div className="form-group">
                <label>축하 메시지</label>
                <textarea
                  value={paymentForm.payer_message}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payer_message: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary" disabled={submittingPayment}>
                  {submittingPayment ? '결제 중...' : '결제하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 메시지 모달 */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>축하 메시지 남기기</h2>
            <form onSubmit={submitMessage}>
              <div className="form-group">
                <label>이름 *</label>
                <input
                  value={messageForm.guest_name}
                  onChange={(e) => setMessageForm({ ...messageForm, guest_name: e.target.value })}
                  type="text"
                  required
                />
              </div>
              <div className="form-group">
                <label>전화번호</label>
                <input
                  value={messageForm.guest_phone}
                  onChange={(e) => setMessageForm({ ...messageForm, guest_phone: e.target.value })}
                  type="tel"
                />
              </div>
              <div className="form-group">
                <label>메시지</label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>사진 업로드</label>
                <input ref={imageInputRef} type="file" onChange={handleImageUpload} accept="image/*" />
                {messageForm.image_url && (
                  <img src={messageForm.image_url} alt="업로드된 사진" style={{ maxWidth: '200px', marginTop: '8px' }} />
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMessageModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary" disabled={submittingMessage}>
                  {submittingMessage ? '전송 중...' : '전송'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
