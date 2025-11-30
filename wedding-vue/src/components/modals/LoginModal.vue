<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const { request } = useApi()

const activeTab = ref<'login' | 'signup'>('login')

// 로그인 폼
const loginEmail = ref('')
const loginPassword = ref('')

// 회원가입 폼
const signupEmail = ref('')
const signupPassword = ref('')
const signupPasswordCheck = ref('')
const signupNickname = ref('')
const signupProfileImage = ref<File | null>(null)
const profileImagePreview = ref<string | null>(null)

const isLoading = computed(() => authStore.loading)
const errorMessage = ref<string | null>(null)

function switchTab(tab: 'login' | 'signup') {
  activeTab.value = tab
  errorMessage.value = null
  authStore.error = null
}

function handleProfileImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    signupProfileImage.value = null
    profileImagePreview.value = null
    return
  }

  // 이미지 미리보기
  const reader = new FileReader()
  reader.onloadend = () => {
    profileImagePreview.value = reader.result as string
  }
  reader.readAsDataURL(file)
  signupProfileImage.value = file
}

async function uploadProfileImage(file: File): Promise<string | null> {
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

async function handleLogin() {
  if (!loginEmail.value || !loginPassword.value) {
    errorMessage.value = '이메일과 비밀번호를 입력해주세요.'
    return
  }

  errorMessage.value = null
  try {
    await authStore.login({ email: loginEmail.value, password: loginPassword.value })
    loginEmail.value = ''
    loginPassword.value = ''
    emit('close')
  } catch (error) {
    console.error(error)
    // 에러는 authStore에서 설정됨
    errorMessage.value = authStore.error
  }
}

async function handleSignup() {
  if (!signupEmail.value || !signupPassword.value || !signupPasswordCheck.value || !signupNickname.value) {
    errorMessage.value = '모든 필드를 입력해주세요.'
    return
  }

  if (signupPassword.value !== signupPasswordCheck.value) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  errorMessage.value = null

  try {
    // 프로필 이미지 업로드
    let profileImageUrl = 'https://via.placeholder.com/150'
    if (signupProfileImage.value) {
      try {
        const uploadedUrl = await Promise.race([
          uploadProfileImage(signupProfileImage.value),
          new Promise<string | null>((_, reject) => setTimeout(() => reject(new Error('타임아웃')), 5000)),
        ])
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl
        }
      } catch (uploadError) {
        console.warn('프로필 이미지 업로드 실패, 기본 이미지 사용:', uploadError)
        // 기본 이미지로 계속 진행
      }
    }

    // 회원가입 요청
    await request('/auth/signup', {
      method: 'POST',
      body: {
        email: signupEmail.value,
        password: signupPassword.value,
        password_check: signupPasswordCheck.value,
        nickname: signupNickname.value,
        profile_image_url: profileImageUrl,
      },
      skipAuthHeader: true,
    })

    // 회원가입 성공 후 로그인 탭으로 전환
    showToast('회원가입 성공! 로그인해주세요.')
    loginEmail.value = signupEmail.value
    signupEmail.value = ''
    signupPassword.value = ''
    signupPasswordCheck.value = ''
    signupNickname.value = ''
    signupProfileImage.value = null
    profileImagePreview.value = null
    switchTab('login')
  } catch (error: any) {
    console.error('회원가입 오류:', error)
    if (error?.data?.message) {
      errorMessage.value = translateErrorMessage(error.data.message)
    } else {
      errorMessage.value = '회원가입 중 오류가 발생했습니다.'
    }
  }
}

function translateErrorMessage(message: string): string {
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

function showToast(message: string) {
  // 간단한 토스트 메시지 (나중에 토스트 컴포넌트로 교체 가능)
  alert(message)
}

function handleOverlayClick(event: MouseEvent) {
  if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" @click="handleOverlayClick">
    <div class="login-modal" @click.stop>
      <div class="login-modal-header">
        <h3>로그인 / 회원가입</h3>
        <button class="modal-close" type="button" @click="emit('close')" aria-label="닫기">×</button>
      </div>
      <div class="login-modal-body">
        <div class="login-tabs">
          <button
            class="login-tab"
            :class="{ active: activeTab === 'login' }"
            type="button"
            @click="switchTab('login')"
          >
            로그인
          </button>
          <button
            class="login-tab"
            :class="{ active: activeTab === 'signup' }"
            type="button"
            @click="switchTab('signup')"
          >
            회원가입
          </button>
        </div>

        <div v-if="errorMessage || authStore.error" class="login-error show">
          {{ errorMessage || authStore.error }}
        </div>

        <!-- 로그인 폼 -->
        <form
          v-if="activeTab === 'login'"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <div class="form-group">
            <label for="login-email">이메일</label>
            <input
              id="login-email"
              v-model="loginEmail"
              type="email"
              placeholder="example@email.com"
              required
            />
          </div>
          <div class="form-group">
            <label for="login-password">비밀번호</label>
            <input
              id="login-password"
              v-model="loginPassword"
              type="password"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          <button class="btn primary" type="submit" :disabled="isLoading" style="width: 100%; margin-top: 8px">
            {{ isLoading ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <!-- 회원가입 폼 -->
        <form
          v-if="activeTab === 'signup'"
          class="login-form"
          @submit.prevent="handleSignup"
        >
          <div class="form-group">
            <label for="signup-email">이메일</label>
            <input
              id="signup-email"
              v-model="signupEmail"
              type="email"
              placeholder="example@email.com"
              required
            />
          </div>
          <div class="form-group">
            <label for="signup-password">비밀번호</label>
            <input
              id="signup-password"
              v-model="signupPassword"
              type="password"
              placeholder="비밀번호를 입력하세요 (8자 이상, 대소문자/특수문자 포함)"
              required
            />
          </div>
          <div class="form-group">
            <label for="signup-password-check">비밀번호 확인</label>
            <input
              id="signup-password-check"
              v-model="signupPasswordCheck"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>
          <div class="form-group">
            <label for="signup-nickname">닉네임</label>
            <input
              id="signup-nickname"
              v-model="signupNickname"
              type="text"
              placeholder="닉네임을 입력하세요 (최대 10자, 띄어쓰기 없음)"
              required
            />
          </div>
          <div class="form-group">
            <label for="signup-profile-image">프로필 이미지</label>
            <input
              id="signup-profile-image"
              type="file"
              accept="image/*"
              @change="handleProfileImageChange"
            />
            <div v-if="profileImagePreview" style="margin-top: 8px">
              <img
                :src="profileImagePreview"
                alt="프로필 미리보기"
                style="
                  width: 80px;
                  height: 80px;
                  object-fit: cover;
                  border-radius: 8px;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                "
              />
            </div>
            <small style="color: var(--muted); font-size: 12px; margin-top: 4px; display: block">
              선택하지 않으면 기본 이미지가 사용됩니다
            </small>
          </div>
          <button
            class="btn primary"
            type="submit"
            :disabled="isLoading"
            style="width: 100%; margin-top: 8px"
          >
            {{ isLoading ? '회원가입 중...' : '회원가입' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-modal {
  width: min(420px, 95vw);
  max-height: 90vh;
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.login-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.login-modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text);
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.05);
}

.login-modal-body {
  padding: 28px;
  overflow-y: auto;
}

.login-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin: -28px -28px 20px;
  padding: 0 28px;
}

.login-tab {
  flex: 1;
  padding: 12px;
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: 0.2s;
}

.login-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-error {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: var(--danger);
  font-size: 14px;
  margin-bottom: 16px;
  display: none;
}

.login-error.show {
  display: block;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.form-group input[type='text'],
.form-group input[type='email'],
.form-group input[type='password'],
.form-group input[type='file'] {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
}

.form-group input[type='file'] {
  padding: 8px;
  cursor: pointer;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
</style>
