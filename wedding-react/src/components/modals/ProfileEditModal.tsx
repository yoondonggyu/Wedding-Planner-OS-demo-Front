import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import './ProfileEditModal.css'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const authStore = useAuthStore()
  const { request } = useApi()
  const { showToast } = useToast()

  const [nickname, setNickname] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (authStore.user) {
      setNickname(authStore.user.nickname || '')
      setProfileImagePreview(authStore.user.profileImageUrl || null)
    }
  }, [authStore.user, isOpen])

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setProfileImage(null)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setProfileImage(file)
  }

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('파일 크기는 5MB 이하여야 합니다.')
        return null
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('JPG, PNG 형식만 가능합니다.')
        return null
      }

      const formData = new FormData()
      formData.append('file', file)

      const res = await request<{ message: string; data: { profile_image_url: string } }>(
        '/users/profile/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      if (res.message === 'upload_success') {
        return res.data.profile_image_url
      }
      return null
    } catch (error: any) {
      console.error('프로필 이미지 업로드 실패:', error)
      if (error instanceof Error) {
        if (error.message.includes('file_too_large')) {
          setErrorMessage('파일 크기는 5MB 이하여야 합니다.')
        } else if (error.message.includes('invalid_file_type')) {
          setErrorMessage('JPG, PNG 형식만 가능합니다.')
        } else {
          setErrorMessage('이미지 업로드에 실패했습니다.')
        }
      }
      return null
    }
  }

  const handleSave = async () => {
    if (!authStore.user?.id) {
      setErrorMessage('로그인이 필요합니다.')
      return
    }

    if (!nickname.trim()) {
      setErrorMessage('닉네임을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      let profileImageUrl = authStore.user.profileImageUrl || null
      if (profileImage) {
        const uploadedUrl = await uploadProfileImage(profileImage)
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl
        }
      }

      await request('/users/profile', {
        method: 'PATCH',
        body: {
          nickname: nickname.trim(),
          profile_image_url: profileImageUrl,
        },
      })

      authStore.refreshUser()
      showToast('프로필이 업데이트되었습니다.', 'success')
      onClose()
    } catch (error: any) {
      console.error('프로필 업데이트 실패:', error)
      setErrorMessage(error?.data?.message || '프로필 업데이트에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>프로필 수정</h3>
          <button className="modal-close" type="button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
          <div className="form-group">
            <label htmlFor="profile-nickname">닉네임</label>
            <input
              id="profile-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={10}
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile-image">프로필 이미지</label>
            <input
              id="profile-image"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleProfileImageChange}
            />
            {profileImagePreview && (
              <div className="image-preview">
                <img src={profileImagePreview} alt="프로필 미리보기" />
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn" type="button" onClick={onClose}>취소</button>
            <button className="btn primary" type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

