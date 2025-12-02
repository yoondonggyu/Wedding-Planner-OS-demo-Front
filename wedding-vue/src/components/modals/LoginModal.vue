<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const { request } = useApi()
const route = useRoute()

const activeTab = ref<'login' | 'signup'>('login')
const inviteCode = ref<string | null>(null)

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
const signupGender = ref<'BRIDE' | 'GROOM' | null>(null)
const signupIsVendor = ref(false)

// 커플 등록 팝업
const showCoupleModal = ref(false)
const coupleKey = ref('')
const partnerCoupleKey = ref('')
const signupResult = ref<{ 
  couple_key?: string
  gender?: string
  vendor_approval_pending?: boolean
  auto_connected?: boolean
  partner_nickname?: string
} | null>(null)

const inviteLink = computed(() => {
  if (!coupleKey.value) return ''
  const baseUrl = window.location.origin
  return `${baseUrl}?invite=${coupleKey.value}`
})

function copyCoupleKey() {
  if (coupleKey.value) {
    navigator.clipboard.writeText(coupleKey.value)
    showToast('커플 키가 복사되었습니다!')
  }
}

function copyInviteLink() {
  if (inviteLink.value) {
    navigator.clipboard.writeText(inviteLink.value)
    showToast('초대 링크가 복사되었습니다!')
  }
}

const isLoading = computed(() => authStore.loading)
const errorMessage = ref<string | null>(null)

// URL에서 초대 코드 읽기
onMounted(() => {
  const invite = route.query.invite as string | undefined
  if (invite) {
    inviteCode.value = invite
    activeTab.value = 'signup'
  }
})

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
        email: signupEmail.value,
        password: signupPassword.value,
        password_check: signupPasswordCheck.value,
        nickname: signupNickname.value,
        profile_image_url: profileImageUrl,
        gender: signupGender.value,
        is_partner_vendor: signupIsVendor.value,
        invite_code: inviteCode.value || null,
      },
      skipAuthHeader: true,
    })

    signupResult.value = signupRes.data

    // 제휴 업체 가입인 경우 승인 대기 메시지
    if (signupRes.data.vendor_approval_pending) {
      showToast('회원가입이 완료되었습니다. 제휴 업체 승인을 기다려주세요.')
      loginEmail.value = signupEmail.value
      resetSignupForm()
      switchTab('login')
      return
    }

    // 초대 링크로 자동 연결된 경우
    if (signupRes.data.auto_connected && signupRes.data.partner_nickname) {
      showToast(`회원가입 완료! ${signupRes.data.partner_nickname}님과 자동으로 연결되었습니다.`)
      loginEmail.value = signupEmail.value
      resetSignupForm()
      switchTab('login')
      return
    }

    // 성별이 선택된 경우 커플 등록 팝업 표시
    if (signupRes.data.couple_key && signupRes.data.gender) {
      coupleKey.value = signupRes.data.couple_key
      showCoupleModal.value = true
    } else {
      // 성별이 선택되지 않은 경우 바로 로그인 탭으로
      showToast('회원가입 성공! 로그인해주세요.')
      loginEmail.value = signupEmail.value
      resetSignupForm()
      switchTab('login')
    }
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

function resetSignupForm() {
  signupEmail.value = ''
  signupPassword.value = ''
  signupPasswordCheck.value = ''
  signupNickname.value = ''
  signupProfileImage.value = null
  profileImagePreview.value = null
  signupGender.value = null
  signupIsVendor.value = false
  signupResult.value = null
}

async function connectCouple() {
  if (!partnerCoupleKey.value.trim()) {
    errorMessage.value = '상대방의 커플 키를 입력해주세요.'
    return
  }

  // 회원가입 직후이므로 먼저 로그인
  try {
    await authStore.login({ email: signupEmail.value, password: signupPassword.value })
    
    // 로그인 성공 후 커플 연결
    await request('/couple/connect', {
      method: 'POST',
      body: {
        partner_couple_key: partnerCoupleKey.value.trim(),
      },
    })

    showToast('커플 연결이 완료되었습니다!')
    loginEmail.value = signupEmail.value
    resetSignupForm()
    showCoupleModal.value = false
    emit('close')
  } catch (error: any) {
    console.error('커플 연결 오류:', error)
    if (error?.data?.error) {
      errorMessage.value = error.data.error
    } else if (error?.data?.message) {
      errorMessage.value = translateErrorMessage(error.data.message)
    } else {
      errorMessage.value = '커플 연결 중 오류가 발생했습니다.'
    }
  }
}

function skipCoupleRegistration() {
  showToast('회원가입 성공! 나중에 커플을 등록할 수 있습니다.')
  loginEmail.value = signupEmail.value
  resetSignupForm()
  showCoupleModal.value = false
  switchTab('login')
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
          <!-- 초대 링크로 접근한 경우 안내 -->
          <div v-if="inviteCode" style="padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; margin-bottom: 16px; border: 1px solid rgba(102, 126, 234, 0.3);">
            <p style="margin: 0; font-size: 13px; color: var(--text);">
              💕 초대 링크로 접근하셨습니다. 회원가입 시 자동으로 커플이 연결됩니다!
            </p>
          </div>
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
          
          <div class="form-group">
            <label>성별 선택 (선택사항)</label>
            <div style="display: flex; gap: 8px;">
              <button
                type="button"
                :class="['btn', 'gender-btn', { active: signupGender === 'BRIDE' }]"
                @click="signupGender = 'BRIDE'"
              >
                👰 신부
              </button>
              <button
                type="button"
                :class="['btn', 'gender-btn', { active: signupGender === 'GROOM' }]"
                @click="signupGender = 'GROOM'"
              >
                🤵 신랑
              </button>
            </div>
            <small style="color: var(--muted); font-size: 12px; margin-top: 4px; display: block">
              성별을 선택하면 커플 연결 기능을 사용할 수 있습니다
            </small>
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input
                type="checkbox"
                v-model="signupIsVendor"
                style="width: auto;"
              />
              <span>제휴 업체로 가입하기</span>
            </label>
            <small style="color: var(--muted); font-size: 12px; margin-top: 4px; display: block">
              제휴 업체 가입은 시스템 관리자 승인이 필요합니다
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

    <!-- 커플 등록 팝업 -->
    <div v-if="showCoupleModal" class="modal-overlay" @click.self="skipCoupleRegistration">
      <div class="couple-modal" @click.stop>
        <div class="couple-modal-header">
          <h3>{{ signupResult?.gender === 'BRIDE' ? '신부' : '신랑' }}로 가입하셨습니다!</h3>
        </div>
        <div class="couple-modal-body">
          <div class="couple-info">
            <p style="margin-bottom: 16px; color: var(--muted);">
              {{ signupResult?.gender === 'BRIDE' ? '신랑' : '신부' }}을 등록하시겠습니까?
            </p>
            
            <div class="couple-key-display">
              <label>나의 커플 키</label>
              <div class="key-box">
                <code style="font-size: 18px; letter-spacing: 2px;">{{ coupleKey }}</code>
                <button
                  type="button"
                  class="btn-copy"
                  @click="copyCoupleKey"
                >
                  복사
                </button>
              </div>
              <small style="color: var(--muted); font-size: 12px; margin-top: 4px; display: block">
                이 키를 상대방에게 공유하세요
              </small>
              
              <div style="margin-top: 16px; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
                <label style="font-size: 12px; color: var(--muted); margin-bottom: 8px; display: block;">초대 링크</label>
                <div class="key-box" style="margin-bottom: 8px;">
                  <code style="font-size: 14px; word-break: break-all;">{{ inviteLink }}</code>
                  <button
                    type="button"
                    class="btn-copy"
                    @click="copyInviteLink"
                  >
                    링크 복사
                  </button>
                </div>
                <small style="color: var(--muted); font-size: 11px; display: block">
                  이 링크를 상대방에게 보내면 자동으로 연결됩니다
                </small>
              </div>
            </div>

            <div class="couple-key-input" style="margin-top: 24px;">
              <label>상대방의 커플 키 입력</label>
              <input
                v-model="partnerCoupleKey"
                type="text"
                placeholder="상대방의 커플 키를 입력하세요"
                style="width: 100%; padding: 10px 12px; border-radius: 10px; background: var(--soft); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text); font-size: 14px; letter-spacing: 2px; text-transform: uppercase;"
                maxlength="8"
              />
            </div>

            <div style="display: flex; gap: 8px; margin-top: 20px;">
              <button
                class="btn"
                type="button"
                @click="skipCoupleRegistration"
                style="flex: 1;"
              >
                나중에
              </button>
              <button
                class="btn primary"
                type="button"
                @click="connectCouple"
                :disabled="!partnerCoupleKey.trim()"
                style="flex: 1;"
              >
                연결하기
              </button>
            </div>
          </div>
        </div>
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

.gender-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  background: var(--soft);
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}

.gender-btn.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-color: var(--accent);
  color: white;
}

.couple-modal {
  width: min(480px, 95vw);
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.couple-modal-header {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.couple-modal-header h3 {
  margin: 0;
  font-size: 20px;
  text-align: center;
}

.couple-modal-body {
  padding: 28px;
}

.couple-key-display {
  margin-bottom: 16px;
}

.couple-key-display label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 8px;
}

.key-box {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: var(--soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.key-box code {
  flex: 1;
  text-align: center;
  font-weight: 600;
  color: var(--accent);
}

.btn-copy {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-copy:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
