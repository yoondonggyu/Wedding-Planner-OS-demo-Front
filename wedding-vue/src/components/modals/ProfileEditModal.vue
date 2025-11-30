<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const { request } = useApi()

const nickname = ref('')
const profileImage = ref<File | null>(null)
const profileImagePreview = ref<string | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// 현재 사용자 정보로 초기화
watch(
  () => authStore.user,
  (user) => {
    if (user) {
      nickname.value = user.nickname || ''
      profileImagePreview.value = user.profileImageUrl || null
    }
  },
  { immediate: true }
)

function handleProfileImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    profileImage.value = null
    return
  }

  // 이미지 미리보기
  const reader = new FileReader()
  reader.onloadend = () => {
    profileImagePreview.value = reader.result as string
  }
  reader.readAsDataURL(file)
  profileImage.value = file
}

async function uploadProfileImage(file: File): Promise<string | null> {
  try {
    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      errorMessage.value = '파일 크기는 5MB 이하여야 합니다.'
      return null
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      errorMessage.value = 'JPG, PNG 형식만 가능합니다.'
      return null
    }

    const formData = new FormData()
    formData.append('file', file)

    console.log('프로필 이미지 업로드 요청:', file.name, file.size, file.type)
    const res = await request<{ message: string; data: { profile_image_url: string } }>(
      '/users/profile/upload',
      {
        method: 'POST',
        body: formData,
      }
    )

    console.log('프로필 이미지 업로드 응답:', res)
    if (res.message === 'upload_success') {
      const url = res.data.profile_image_url
      console.log('업로드된 프로필 이미지 URL:', url)
      return url
    }
    return null
  } catch (error: any) {
    console.error('프로필 이미지 업로드 실패:', error)
    if (error instanceof Error) {
      if (error.message.includes('file_too_large')) {
        errorMessage.value = '파일 크기는 5MB 이하여야 합니다.'
      } else if (error.message.includes('invalid_file_type')) {
        errorMessage.value = 'JPG, PNG 형식만 가능합니다.'
      } else {
        errorMessage.value = '이미지 업로드에 실패했습니다.'
      }
    }
    return null
  }
}

async function handleSave() {
  if (!authStore.user?.id) {
    errorMessage.value = '로그인이 필요합니다.'
    return
  }

  const trimmedNickname = nickname.value.trim()
  if (!trimmedNickname) {
    errorMessage.value = '닉네임을 입력해주세요.'
    return
  }

  // 닉네임 길이 검증 (2-20자)
  if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
    errorMessage.value = '닉네임은 2자 이상 20자 이하여야 합니다.'
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    // 프로필 이미지 업로드 (새 이미지가 있는 경우)
    let profileImageUrl = authStore.user.profileImageUrl
    if (profileImage.value) {
      console.log('프로필 이미지 업로드 시작...')
      const uploadedUrl = await uploadProfileImage(profileImage.value)
      console.log('업로드된 URL:', uploadedUrl)
      if (!uploadedUrl) {
        // 업로드 실패 시 에러 메시지는 uploadProfileImage에서 설정됨
        isLoading.value = false
        return
      }
      profileImageUrl = uploadedUrl
    }

    // 닉네임 또는 프로필 이미지가 변경된 경우 API 호출
    const nicknameChanged = trimmedNickname !== authStore.user.nickname
    const imageChanged = profileImageUrl !== authStore.user.profileImageUrl

    if (nicknameChanged || imageChanged) {
      console.log('프로필 수정 API 호출...', { nicknameChanged, imageChanged, profileImageUrl })
      const res = await request<{ message: string; data: { nickname: string; profile_image_url: string | null } }>(
        '/users/profile',
        {
          method: 'PATCH',
          body: {
            nickname: trimmedNickname,
            profile_image_url: profileImageUrl || null,
          },
        }
      )

      if (res.message === 'update_profile_success') {
        console.log('사용자 정보 업데이트:', res.data)
        // 사용자 정보 업데이트 (닉네임 + 프로필 이미지)
        authStore.setSession({
          accessToken: authStore.accessToken,
          refreshToken: authStore.refreshToken,
          user: {
            id: authStore.user.id,
            nickname: res.data.nickname,
            profileImageUrl: res.data.profile_image_url || null,
          },
        })
        console.log('업데이트된 사용자 정보:', authStore.user)
        alert('프로필이 수정되었습니다.')
        emit('close')
      }
    } else {
      // 변경사항이 없는 경우
      alert('변경된 내용이 없습니다.')
      emit('close')
    }
  } catch (error: any) {
    console.error('프로필 수정 실패:', error)
    
    // API 에러 메시지 파싱
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      if (errorMsg.includes('duplicate_nickname') || errorMsg.includes('중복')) {
        errorMessage.value = '이미 사용 중인 닉네임입니다.'
      } else if (errorMsg.includes('validation') || errorMsg.includes('검증')) {
        errorMessage.value = '닉네임 형식이 올바르지 않습니다. (2-20자, 특수문자 제한)'
      } else if (errorMsg.includes('unauthorized') || errorMsg.includes('인증')) {
        errorMessage.value = '로그인이 필요합니다.'
      } else {
        errorMessage.value = error.message || '프로필 수정에 실패했습니다.'
      }
    } else {
      errorMessage.value = '프로필 수정에 실패했습니다.'
    }
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  // 원래 값으로 복원
  if (authStore.user) {
    nickname.value = authStore.user.nickname || ''
    profileImagePreview.value = authStore.user.profileImageUrl || null
  }
  profileImage.value = null
  errorMessage.value = null
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-card">
      <h3 style="margin-top: 0">개인 정보 수정</h3>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label>프로필 이미지</label>
        <div style="display: flex; gap: 16px; align-items: center">
          <div
            v-if="profileImagePreview"
            style="
              width: 100px;
              height: 100px;
              border-radius: 50%;
              overflow: hidden;
              border: 2px solid var(--soft);
              background: var(--soft);
            "
          >
            <img
              :src="profileImagePreview"
              alt="프로필 미리보기"
              style="width: 100%; height: 100%; object-fit: cover"
            />
          </div>
          <div v-else style="width: 100px; height: 100px; border-radius: 50%; background: var(--soft); display: flex; align-items: center; justify-content: center; color: var(--muted)">
            이미지 없음
          </div>
          <div style="flex: 1">
            <input
              type="file"
              accept="image/*"
              @change="handleProfileImageChange"
              style="display: none"
              id="profile-image-input"
            />
            <label for="profile-image-input" class="btn" style="cursor: pointer; display: inline-block">
              이미지 선택
            </label>
            <p style="font-size: 12px; color: var(--muted); margin-top: 8px">
              JPG, PNG 형식만 가능합니다.
            </p>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>닉네임</label>
        <input v-model="nickname" type="text" placeholder="닉네임을 입력하세요" required />
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px">
        <button class="btn" type="button" @click="handleClose" :disabled="isLoading">
          취소
        </button>
        <button class="btn primary" type="button" @click="handleSave" :disabled="isLoading">
          {{ isLoading ? '저장 중...' : '저장' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: var(--danger);
  margin-bottom: 16px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text);
}

.form-group input[type="text"] {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: var(--soft);
  color: var(--text);
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: var(--accent);
}

.form-group input[type="text"]::placeholder {
  color: var(--muted);
}
</style>

