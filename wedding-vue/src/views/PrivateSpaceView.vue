<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import CoupleInviteModal from '@/components/modals/CoupleInviteModal.vue'

interface PostSummary {
  post_id: number
  user_id?: number
  title: string
  content: string
  nickname: string
  created_at?: string
  tags?: { name: string }[] | string[]
  sentiment_label?: string | null
  summary?: string | null
  image_url?: string | null
  like_count?: number
  view_count?: number
  comment_count?: number
  liked?: boolean
}

interface PostDetail extends PostSummary {
  comments?: CommentItem[]
}

interface CommentItem {
  comment_id: number
  content: string
  nickname?: string
  user_id?: number
  created_at?: string
  is_editing?: boolean
  edit_content?: string
}

const posts = ref<PostSummary[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const selectedPostId = ref<number | null>(null)
const postDetail = ref<PostDetail | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)

const comments = ref<CommentItem[]>([])
const commentsLoading = ref(false)
const commentInput = ref('')
const commentSubmitting = ref(false)

const likeLoading = ref(false)

const showWriteModal = ref(false)
const formTitle = ref('')
const formContent = ref('')
const formImageUrl = ref<string | null>(null)
const formSubmitting = ref(false)
const imageUploading = ref(false)
const aiAnalyzing = ref(false)
const aiAnalysisResult = ref<{
  tags?: string[]
  summary?: string
  sentiment?: { label: string; confidence: number }
} | null>(null)

const authStore = useAuthStore()
const { request } = useApi()

const canWrite = computed(() => authStore.isAuthenticated)
const hasPosts = computed(() => posts.value.length > 0)

// 커플 연결 상태
const isCoupleConnected = ref(false)
const showCoupleModal = ref(false)
const coupleKey = ref<string | null>(null)
const userGender = ref<'BRIDE' | 'GROOM' | null>(null)
const checkingCoupleStatus = ref(false)

function normalizeTags(tags?: { name: string }[] | string[]) {
  return (tags ?? []).map((tag) => (typeof tag === 'string' ? tag : tag.name))
}

const detailTags = computed(() => (postDetail.value?.tags ? normalizeTags(postDetail.value.tags) : []))

async function checkCoupleConnection() {
  if (!authStore.isAuthenticated) {
    return false
  }

  checkingCoupleStatus.value = true
  try {
    const coupleInfo = await request<{
      message: string
      data: {
        is_connected?: boolean
        couple_id?: number
        couple_key?: string
        gender?: string
      }
    }>('/couple/info')

    if (coupleInfo.message === 'couple_info_retrieved' && coupleInfo.data?.is_connected) {
      isCoupleConnected.value = true
      return true
    } else {
      // 커플이 연결되지 않은 경우 커플 키 조회
      const myKey = await request<{
        message: string
        data: {
          couple_key?: string
          gender?: string
          is_connected?: boolean
        }
      }>('/couple/my-key')

      if (myKey.data?.couple_key && myKey.data?.gender) {
        coupleKey.value = myKey.data.couple_key
        userGender.value = myKey.data.gender as 'BRIDE' | 'GROOM'
        showCoupleModal.value = true
      } else {
        // 커플 키도 없는 경우 (성별 미설정)
        alert('커플 기능을 사용하려면 회원가입 시 성별을 선택해주세요.')
      }
      isCoupleConnected.value = false
      return false
    }
  } catch (err: any) {
    console.error('커플 연결 상태 확인 실패:', err)
    isCoupleConnected.value = false
    return false
  } finally {
    checkingCoupleStatus.value = false
  }
}

async function fetchPosts() {
  // 커플 연결 확인
  const connected = await checkCoupleConnection()
  if (!connected) {
    posts.value = []
    return
  }

  loading.value = true
  error.value = null
  try {
    const res = await request<{
      message: string
      data: { posts: PostSummary[] }
    }>(`/posts?board_type=private`, {
      method: 'GET',
    })
    posts.value = res.data?.posts ?? []
    if (posts.value.length > 0) {
      const firstPost = posts.value.find((p) => p.post_id === selectedPostId.value) ?? posts.value[0]
      await fetchPostDetail(firstPost.post_id)
    } else {
      selectedPostId.value = null
      postDetail.value = null
    }
  } catch (err: any) {
    console.error('게시글 목록 로드 실패:', err)
    error.value = err?.data?.error || err?.message || '게시글을 불러올 수 없습니다.'
    posts.value = []
  } finally {
    loading.value = false
  }
}

function handleCoupleConnected() {
  showCoupleModal.value = false
  // 커플 연결 후 게시글 다시 로드
  setTimeout(() => {
    fetchPosts()
  }, 500)
}

async function fetchPostDetail(postId: number) {
  if (selectedPostId.value === postId && postDetail.value) {
    return
  }

  detailLoading.value = true
  detailError.value = null
  selectedPostId.value = postId

  try {
    const res = await request<{
      message: string
      data: PostDetail
    }>(`/posts/${postId}`, {
      method: 'GET',
    })

    postDetail.value = res.data
    comments.value = res.data.comments ?? []
  } catch (err: any) {
    console.error('게시글 상세 로드 실패:', err)
    detailError.value = err?.data?.error || err?.message || '게시글을 불러올 수 없습니다.'
    postDetail.value = null
  } finally {
    detailLoading.value = false
  }
}

async function toggleLike(postId: number) {
  if (likeLoading.value) return

  likeLoading.value = true
  try {
    const res = await request<{
      message: string
      data: { like_count: number; liked: boolean }
    }>(`/posts/${postId}/like`, {
      method: 'POST',
    })

    if (postDetail.value && postDetail.value.post_id === postId) {
      postDetail.value.like_count = res.data.like_count
      postDetail.value.liked = res.data.liked
    }

    const post = posts.value.find((p) => p.post_id === postId)
    if (post) {
      post.like_count = res.data.like_count
      post.liked = res.data.liked
    }
  } catch (err: any) {
    console.error('좋아요 실패:', err)
    alert(err?.data?.error || err?.message || '좋아요 처리에 실패했습니다.')
  } finally {
    likeLoading.value = false
  }
}

async function submitComment() {
  if (!commentInput.value.trim() || !selectedPostId.value || commentSubmitting.value) return

  commentSubmitting.value = true
  try {
    const res = await request<{
      message: string
      data: CommentItem
    }>(`/posts/${selectedPostId.value}/comments`, {
      method: 'POST',
      body: {
        content: commentInput.value.trim(),
      },
    })

    comments.value.push(res.data)
    commentInput.value = ''

    if (postDetail.value) {
      postDetail.value.comment_count = (postDetail.value.comment_count || 0) + 1
    }
  } catch (err: any) {
    console.error('댓글 작성 실패:', err)
    alert(err?.data?.error || err?.message || '댓글 작성에 실패했습니다.')
  } finally {
    commentSubmitting.value = false
  }
}

async function submitPost() {
  if (!formTitle.value.trim() || !formContent.value.trim() || formSubmitting.value) {
    alert('제목과 내용을 입력해주세요.')
    return
  }

  formSubmitting.value = true
  try {
    const res = await request<{
      message: string
      data: { post_id: number }
    }>('/posts', {
      method: 'POST',
      body: {
        title: formTitle.value.trim(),
        content: formContent.value.trim(),
        image_url: formImageUrl.value || null,
        board_type: 'private',
      },
    })

    showWriteModal.value = false
    formTitle.value = ''
    formContent.value = ''
    formImageUrl.value = null
    aiAnalysisResult.value = null

    await fetchPosts()
    if (res.data?.post_id) {
      await fetchPostDetail(res.data.post_id)
    }
  } catch (err: any) {
    console.error('게시글 작성 실패:', err)
    alert(err?.data?.error || err?.message || '게시글 작성에 실패했습니다.')
  } finally {
    formSubmitting.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchPosts()
  }
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    fetchPosts()
  } else {
    posts.value = []
    postDetail.value = null
    isCoupleConnected.value = false
    showCoupleModal.value = false
  }
})
</script>

<template>
  <div class="board-view">
    <div v-if="checkingCoupleStatus" class="loading">커플 연결 상태 확인 중...</div>
    <div v-else-if="!isCoupleConnected" class="empty-state">
      <div class="couple-required-message">
        <h2>💑 커플 등록이 필요합니다</h2>
        <p>우리만의 공간을 사용하려면 먼저 커플을 등록해주세요.</p>
        <button class="write-btn" @click="showCoupleModal = true">
          <span class="icon">💕</span>
          <span>커플 등록하기</span>
        </button>
      </div>
    </div>
    <template v-else>
      <div class="board-header">
        <div class="header-content">
          <h1>💑 우리만의 공간</h1>
          <p class="header-description">둘만의 비밀 노트와 기록을 남기는 공간입니다.</p>
        </div>
        <button v-if="canWrite" class="write-btn" @click="showWriteModal = true">
          <span class="icon">✏️</span>
          <span>글쓰기</span>
        </button>
      </div>

    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!hasPosts" class="empty-state">
      <p>아직 작성된 글이 없습니다.</p>
      <button v-if="canWrite" class="write-btn" @click="showWriteModal = true">첫 글 작성하기</button>
    </div>
    <div v-else class="board-content">
      <div class="posts-list">
        <div
          v-for="post in posts"
          :key="post.post_id"
          class="post-card"
          :class="{ active: selectedPostId === post.post_id }"
          @click="fetchPostDetail(post.post_id)"
        >
          <div class="post-header">
            <h3>{{ post.title }}</h3>
            <div class="post-meta">
              <span class="author">{{ post.nickname }}</span>
              <span class="date">{{ post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR') : '' }}</span>
            </div>
          </div>
          <p class="post-content">{{ post.content.substring(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}</p>
          <div class="post-footer">
            <span class="likes">❤️ {{ post.like_count || 0 }}</span>
            <span class="views">👁️ {{ post.view_count || 0 }}</span>
            <span class="comments">💬 {{ post.comment_count || 0 }}</span>
          </div>
        </div>
      </div>

      <div v-if="postDetail" class="post-detail">
        <div class="detail-header">
          <h2>{{ postDetail.title }}</h2>
          <div class="detail-meta">
            <span class="author">{{ postDetail.nickname }}</span>
            <span class="date">{{ postDetail.created_at ? new Date(postDetail.created_at).toLocaleDateString('ko-KR') : '' }}</span>
          </div>
        </div>
        <div class="detail-content">
          <p>{{ postDetail.content }}</p>
          <img v-if="postDetail.image_url" :src="postDetail.image_url" alt="게시글 이미지" class="detail-image" />
        </div>
        <div class="detail-actions">
          <button class="action-btn" :class="{ liked: postDetail.liked }" @click="toggleLike(postDetail.post_id)">
            <span>❤️</span>
            <span>좋아요 ({{ postDetail.like_count || 0 }})</span>
          </button>
        </div>
        <div class="comments-section">
          <h3>댓글 ({{ comments.length }})</h3>
          <div v-if="comments.length === 0" class="no-comments">첫 댓글을 남겨보세요.</div>
          <div v-else class="comments-list">
            <div v-for="comment in comments" :key="comment.comment_id" class="comment-item">
              <span class="comment-author">{{ comment.nickname || '익명' }}</span>
              <span class="comment-content">{{ comment.content }}</span>
            </div>
          </div>
          <div class="comment-input">
            <input
              v-model="commentInput"
              type="text"
              placeholder="댓글을 입력하세요"
              @keyup.enter="submitComment"
            />
            <button @click="submitComment" :disabled="commentSubmitting">작성</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 글쓰기 모달 -->
    <div v-if="showWriteModal" class="modal-overlay" @click.self="showWriteModal = false">
      <div class="modal-content">
        <h2>새 글 작성</h2>
        <form @submit.prevent="submitPost">
          <div class="form-group">
            <label>제목</label>
            <input v-model="formTitle" type="text" required placeholder="제목을 입력하세요" />
          </div>
          <div class="form-group">
            <label>내용</label>
            <textarea v-model="formContent" required placeholder="내용을 입력하세요" rows="10"></textarea>
          </div>
          <div class="form-group">
            <label>이미지 URL (선택)</label>
            <input v-model="formImageUrl" type="url" placeholder="https://..." />
          </div>
          <div class="form-actions">
            <button type="button" @click="showWriteModal = false">취소</button>
            <button type="submit" :disabled="formSubmitting">{{ formSubmitting ? '작성 중...' : '작성' }}</button>
          </div>
        </form>
      </div>
    </div>

      <!-- 커플 등록 모달 -->
      <CoupleInviteModal
        v-if="showCoupleModal"
        :show="showCoupleModal"
        :couple-key="coupleKey"
        :gender="userGender"
        @close="showCoupleModal = false"
        @connected="handleCoupleConnected"
      />
    </template>
  </div>
</template>

<style scoped>
.board-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: var(--text, #333);
}

.header-description {
  margin: 0;
  color: var(--muted, #666);
  font-size: 14px;
}

.write-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.write-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 48px;
  color: var(--muted, #666);
}

.couple-required-message {
  max-width: 500px;
  margin: 0 auto;
  padding: 48px;
  text-align: center;
}

.couple-required-message h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: var(--text, #333);
}

.couple-required-message p {
  margin: 0 0 24px 0;
  font-size: 16px;
  color: var(--muted, #666);
  line-height: 1.6;
}

.board-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-card {
  padding: 16px;
  background: var(--card, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.post-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.post-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.post-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--text, #333);
}

.post-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--muted, #999);
  margin-bottom: 8px;
}

.post-content {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--text, #666);
  line-height: 1.6;
}

.post-footer {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--muted, #999);
}

.post-detail {
  padding: 24px;
  background: var(--card, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
}

.detail-header h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: var(--text, #333);
}

.detail-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: var(--muted, #999);
  margin-bottom: 24px;
}

.detail-content {
  margin-bottom: 24px;
}

.detail-content p {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text, #333);
  white-space: pre-wrap;
}

.detail-image {
  max-width: 100%;
  border-radius: 8px;
  margin-top: 16px;
}

.detail-actions {
  margin-bottom: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border, #e5e7eb);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--soft, #f5f5f5);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--border, #e5e7eb);
}

.action-btn.liked {
  background: rgba(255, 0, 0, 0.1);
  border-color: #ff0000;
  color: #ff0000;
}

.comments-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: var(--text, #333);
}

.no-comments {
  padding: 24px;
  text-align: center;
  color: var(--muted, #999);
  font-size: 14px;
}

.comments-list {
  margin-bottom: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--soft, #f5f5f5);
  border-radius: 6px;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: var(--text, #333);
  font-size: 14px;
}

.comment-content {
  flex: 1;
  color: var(--text, #666);
  font-size: 14px;
}

.comment-input {
  display: flex;
  gap: 8px;
}

.comment-input input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
}

.comment-input button {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.comment-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
  background: var(--card, #fff);
  padding: 24px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: var(--text, #333);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text, #333);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.form-actions button[type="button"] {
  background: var(--soft, #f5f5f5);
  color: var(--text, #666);
}

.form-actions button[type="submit"] {
  background: #667eea;
  color: white;
}

.form-actions button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

