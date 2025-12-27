import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import VendorInfoModal, { VendorInfo } from './VendorInfoModal'
import './LoginModal.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [searchParams] = useSearchParams()
  const authStore = useAuthStore()
  const { request } = useApi()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  
  // 로그인 폼
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // 회원가입 폼
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordCheck, setSignupPasswordCheck] = useState('')
  const [signupNickname, setSignupNickname] = useState('')
  const [signupProfileImage, setSignupProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [signupGender, setSignupGender] = useState<'BRIDE' | 'GROOM' | null>(null)
  const [signupIsVendor, setSignupIsVendor] = useState(false)
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null)
  const [showVendorInfoModal, setShowVendorInfoModal] = useState(false)
  
  // 커플 등록 팝업
  const [showCoupleModal, setShowCoupleModal] = useState(false)
  const [coupleKey, setCoupleKey] = useState('')
  const [partnerCoupleKey, setPartnerCoupleKey] = useState('')
  const [signupResult, setSignupResult] = useState<{
    couple_key?: string
    gender?: string
    vendor_approval_pending?: boolean
    auto_connected?: boolean
    partner_nickname?: string
  } | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inviteLink = useMemo(() => {
    if (!coupleKey) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}?invite=${coupleKey}`
  }, [coupleKey])

  useEffect(() => {
    const invite = searchParams.get('invite')
    if (invite) {
      setInviteCode(invite)
      setActiveTab('signup')
    }
  }, [searchParams])

  if (!isOpen) return null

  const switchTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab)
    setErrorMessage(null)
    authStore.closeLoginModal()
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSignupProfileImage(null)
      setProfileImagePreview(null)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setSignupProfileImage(file)
  }

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await request<{ message: string; data: { profile_image_url: string } }>(
        '/users/profile/upload',
        {
          method: 'POST',
          body: formData,
          skipAuthHeader: true,
        }
      )

      if (res.message === 'upload_success') {
        return res.data.profile_image_url
      }
      return null
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error)
      return null
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setErrorMessage(null)
    try {
      await authStore.login({ email: loginEmail, password: loginPassword })
      setLoginEmail('')
      setLoginPassword('')
      onClose()
    } catch (error) {
      console.error(error)
      setErrorMessage(authStore.error || '로그인에 실패했습니다.')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupEmail || !signupPassword || !signupPasswordCheck || !signupNickname) {
      setErrorMessage('모든 필드를 입력해주세요.')
      return
    }

    if (signupPassword !== signupPasswordCheck) {
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    // 제휴 업체 가입인 경우 업체 정보 입력 모달 표시
    if (signupIsVendor) {
      if (!vendorInfo) {
        setShowVendorInfoModal(true)
        return
      }
    } else {
      // 예비 부부 가입인 경우 성별 선택 필수
      if (!signupGender) {
        setErrorMessage('예비 부부 가입 시 신부 또는 신랑을 선택해주세요.')
        return
      }
    }

    setErrorMessage(null)

    try {
      let profileImageUrl = 'https://via.placeholder.com/150'
      if (signupProfileImage) {
        try {
          const uploadedUrl = await Promise.race([
            uploadProfileImage(signupProfileImage),
            new Promise<string | null>((_, reject) => setTimeout(() => reject(new Error('타임아웃')), 5000)),
          ])
          if (uploadedUrl) {
            profileImageUrl = uploadedUrl
          }
        } catch (uploadError) {
          console.warn('프로필 이미지 업로드 실패, 기본 이미지 사용:', uploadError)
        }
      }

      const signupRes = await request<{
        message: string
        data: {
          user_id: number
          couple_key?: string
          gender?: string
          vendor_approval_pending?: boolean
          auto_connected?: boolean
          partner_nickname?: string
        }
      }>('/auth/signup', {
        method: 'POST',
        body: {
          email: signupEmail,
          password: signupPassword,
          password_check: signupPasswordCheck,
          nickname: signupNickname,
          profile_image_url: profileImageUrl,
          gender: signupGender,
          is_partner_vendor: signupIsVendor,
          invite_code: inviteCode || null,
          vendor_info: signupIsVendor && vendorInfo ? vendorInfo : null,
        },
        skipAuthHeader: true,
      })

      setSignupResult(signupRes.data)

      if (signupRes.data.vendor_approval_pending) {
        showToast('회원가입이 완료되었습니다. 제휴 업체 승인을 기다려주세요.')
        setLoginEmail(signupEmail)
        resetSignupForm()
        switchTab('login')
        return
      }

      if (signupRes.data.auto_connected && signupRes.data.partner_nickname) {
        showToast(`회원가입 완료! ${signupRes.data.partner_nickname}님과 자동으로 연결되었습니다.`)
        setLoginEmail(signupEmail)
        resetSignupForm()
        switchTab('login')
        return
      }

      if (signupRes.data.couple_key && signupRes.data.gender) {
        setCoupleKey(signupRes.data.couple_key)
        setShowCoupleModal(true)
      } else {
        showToast('회원가입 성공! 로그인해주세요.')
        setLoginEmail(signupEmail)
        resetSignupForm()
        switchTab('login')
      }
    } catch (error: any) {
      console.error('회원가입 오류:', error)
      if (error?.data?.message) {
        setErrorMessage(translateErrorMessage(error.data.message))
      } else {
        setErrorMessage('회원가입 중 오류가 발생했습니다.')
      }
    }
  }

  const translateErrorMessage = (message: string): string => {
    const messages: Record<string, string> = {
      email_required: '이메일을 입력해주세요.',
      invalid_email_format: '올바른 이메일 주소 형식을 입력해주세요.',
      password_required: '비밀번호를 입력해주세요.',
      invalid_password_format: '비밀번호는 8자 이상, 20자 이하이며 대문자, 소문자, 특수문자를 각각 1개 포함해야 합니다.',
      password_check_required: '비밀번호를 한번 더 입력해주세요.',
      password_mismatch: '비밀번호가 다릅니다.',
      nickname_required: '닉네임을 입력해주세요.',
      nickname_contains_space: '띄어쓰기를 없애주세요.',
      nickname_too_long: '닉네임은 최대 10자까지 작성 가능합니다.',
      duplicate_email: '중복된 이메일입니다.',
      duplicate_nickname: '중복된 닉네임입니다.',
      profile_image_url_required: '프로필 사진을 추가해주세요.',
      invalid_credentials: '아이디 또는 비밀번호를 확인해주세요.',
      login_failed: '로그인에 실패했습니다.',
      signup_failed: '회원가입에 실패했습니다.',
    }
    return messages[message] || message
  }

  const resetSignupForm = () => {
    setSignupEmail('')
    setSignupPassword('')
    setSignupPasswordCheck('')
    setSignupNickname('')
    setSignupProfileImage(null)
    setProfileImagePreview(null)
    setSignupGender(null)
    setSignupIsVendor(false)
    setVendorInfo(null)
    setSignupResult(null)
  }

  const handleVendorInfoSubmit = (info: VendorInfo) => {
    setVendorInfo(info)
    setShowVendorInfoModal(false)
    // 업체 정보 입력 후 회원가입 진행
    const form = document.querySelector('.login-form') as HTMLFormElement
    if (form) {
      form.requestSubmit()
    }
  }

  const connectCouple = async () => {
    if (!partnerCoupleKey.trim()) {
      setErrorMessage('상대방의 커플 키를 입력해주세요.')
      return
    }

    try {
      await authStore.login({ email: signupEmail, password: signupPassword })
      
      await request('/couple/connect', {
        method: 'POST',
        body: {
          partner_couple_key: partnerCoupleKey.trim(),
        },
      })

      showToast('커플 연결이 완료되었습니다!')
      setLoginEmail(signupEmail)
      resetSignupForm()
      setShowCoupleModal(false)
      onClose()
    } catch (error: any) {
      console.error('커플 연결 오류:', error)
      if (error?.data?.error) {
        setErrorMessage(error.data.error)
      } else if (error?.data?.message) {
        setErrorMessage(translateErrorMessage(error.data.message))
      } else {
        setErrorMessage('커플 연결 중 오류가 발생했습니다.')
      }
    }
  }

  const skipCoupleRegistration = () => {
    showToast('회원가입 성공! 나중에 커플을 등록할 수 있습니다.')
    setLoginEmail(signupEmail)
    resetSignupForm()
    setShowCoupleModal(false)
    switchTab('login')
  }

  const copyCoupleKey = () => {
    if (coupleKey) {
      navigator.clipboard.writeText(coupleKey)
      showToast('커플 키가 복사되었습니다!')
    }
  }

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      showToast('초대 링크가 복사되었습니다!')
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      onClose()
    }
  }

  return (
    <>
      <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
        <div className="login-modal" onClick={(e) => e.stopPropagation()}>
          <div className="login-modal-header">
            <h3>로그인 / 회원가입</h3>
            <button className="modal-close" type="button" onClick={onClose} aria-label="닫기">×</button>
          </div>
          <div className="login-modal-body">
            <div className="login-tabs">
              <button
                className={`login-tab ${activeTab === 'login' ? 'active' : ''}`}
                type="button"
                onClick={() => switchTab('login')}
              >
                로그인
              </button>
              <button
                className={`login-tab ${activeTab === 'signup' ? 'active' : ''}`}
                type="button"
                onClick={() => switchTab('signup')}
              >
                회원가입
              </button>
            </div>

            {(errorMessage || authStore.error) && (
              <div className="login-error show">
                {errorMessage || authStore.error}
              </div>
            )}

            {activeTab === 'login' && (
              <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="login-email">이메일</label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">비밀번호</label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                </div>
                <button className="btn primary" type="submit" disabled={authStore.loading} style={{ width: '100%', marginTop: '8px' }}>
                  {authStore.loading ? '로그인 중...' : '로그인'}
                </button>
              </form>
            )}

            {activeTab === 'signup' && (
              <form className="login-form" onSubmit={handleSignup}>
                {inviteCode && (
                  <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                      💕 초대 링크로 접근하셨습니다. 회원가입 시 자동으로 커플이 연결됩니다!
                    </p>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="signup-email">이메일</label>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-password">비밀번호</label>
                  <input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요 (8자 이상, 대소문자/특수문자 포함)"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-password-check">비밀번호 확인</label>
                  <input
                    id="signup-password-check"
                    type="password"
                    value={signupPasswordCheck}
                    onChange={(e) => setSignupPasswordCheck(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-nickname">닉네임</label>
                  <input
                    id="signup-nickname"
                    type="text"
                    value={signupNickname}
                    onChange={(e) => setSignupNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요 (최대 10자, 띄어쓰기 없음)"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-profile-image">프로필 이미지</label>
                  <input
                    id="signup-profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                  />
                  {profileImagePreview && (
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={profileImagePreview}
                        alt="프로필 미리보기"
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      />
                    </div>
                  )}
                  <small style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    선택하지 않으면 기본 이미지가 사용됩니다
                  </small>
                </div>
                
                <div className="form-group">
                  <label>
                    가입 유형 선택 <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      className={`btn type-btn ${!signupIsVendor ? 'active' : ''}`}
                      onClick={() => {
                        setSignupIsVendor(false)
                        setVendorInfo(null)
                      }}
                    >
                      💑 예비 부부
                    </button>
                    <button
                      type="button"
                      className={`btn type-btn ${signupIsVendor ? 'active' : ''}`}
                      onClick={() => {
                        setSignupIsVendor(true)
                        setSignupGender(null)
                      }}
                    >
                      🏢 제휴 업체
                    </button>
                  </div>
                </div>

                {!signupIsVendor && (
                  <div className="form-group">
                    <label>
                      성별 선택 <span className="required">*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className={`btn gender-btn ${signupGender === 'BRIDE' ? 'active' : ''}`}
                        onClick={() => setSignupGender('BRIDE')}
                      >
                        👰 신부
                      </button>
                      <button
                        type="button"
                        className={`btn gender-btn ${signupGender === 'GROOM' ? 'active' : ''}`}
                        onClick={() => setSignupGender('GROOM')}
                      >
                        🤵 신랑
                      </button>
                    </div>
                    <small style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      성별을 선택하면 커플 키를 통해 상대방과 데이터베이스를 공유할 수 있습니다
                    </small>
                  </div>
                )}

                {signupIsVendor && (
                  <div className="form-group">
                    <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px', marginBottom: '12px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                        💼 제휴 업체로 가입하시면 회원가입 후 업체 정보를 입력하시게 됩니다.
                        <br />
                        관리자 승인 후 관리자 페이지 권한이 부여됩니다.
                      </p>
                    </div>
                    {vendorInfo && (
                      <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', marginTop: '8px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                          ✓ 업체 정보가 입력되었습니다: {vendorInfo.vendorName}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn primary"
                  type="submit"
                  disabled={authStore.loading}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {authStore.loading ? '회원가입 중...' : '회원가입'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {showCoupleModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) skipCoupleRegistration()
        }}>
          <div className="couple-modal" onClick={(e) => e.stopPropagation()}>
            <div className="couple-modal-header">
              <h3>{signupResult?.gender === 'BRIDE' ? '신부' : '신랑'}로 가입하셨습니다!</h3>
            </div>
            <div className="couple-modal-body">
              <div className="couple-info">
                <p style={{ marginBottom: '16px', color: 'var(--muted)' }}>
                  {signupResult?.gender === 'BRIDE' ? '신랑' : '신부'}을 등록하시겠습니까?
                </p>
                
                <div className="couple-key-display">
                  <label>나의 커플 키</label>
                  <div className="key-box">
                    <code style={{ fontSize: '18px', letterSpacing: '2px' }}>{coupleKey}</code>
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={copyCoupleKey}
                    >
                      복사
                    </button>
                  </div>
                  <small style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    이 키를 상대방에게 공유하세요
                  </small>
                  
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>초대 링크</label>
                    <div className="key-box" style={{ marginBottom: '8px' }}>
                      <code style={{ fontSize: '14px', wordBreak: 'break-all' }}>{inviteLink}</code>
                      <button
                        type="button"
                        className="btn-copy"
                        onClick={copyInviteLink}
                      >
                        링크 복사
                      </button>
                    </div>
                    <small style={{ color: 'var(--muted)', fontSize: '11px', display: 'block' }}>
                      이 링크를 상대방에게 보내면 자동으로 연결됩니다
                    </small>
                  </div>
                </div>

                <div className="couple-key-input" style={{ marginTop: '24px' }}>
                  <label>상대방의 커플 키 입력</label>
                  <input
                    type="text"
                    value={partnerCoupleKey}
                    onChange={(e) => setPartnerCoupleKey(e.target.value)}
                    placeholder="상대방의 커플 키를 입력하세요"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--soft)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text)', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}
                    maxLength={8}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                  <button
                    className="btn"
                    type="button"
                    onClick={skipCoupleRegistration}
                    style={{ flex: 1 }}
                  >
                    나중에
                  </button>
                  <button
                    className="btn primary"
                    type="button"
                    onClick={connectCouple}
                    disabled={!partnerCoupleKey.trim()}
                    style={{ flex: 1 }}
                  >
                    연결하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 제휴 업체 정보 입력 모달 */}
      <VendorInfoModal
        isOpen={showVendorInfoModal}
        onClose={() => setShowVendorInfoModal(false)}
        onSubmit={handleVendorInfoSubmit}
      />
    </>
  )
}

