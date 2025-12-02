<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

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

// OCR 관련
const ocrProcessing = ref(false)
const ocrText = ref<string | null>(null)
const ocrError = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const authStore = useAuthStore()
const { request } = useApi()

const canWrite = computed(() => authStore.isAuthenticated)
const hasPosts = computed(() => posts.value.length > 0)

function normalizeTags(tags?: { name: string }[] | string[]) {
  return (tags ?? []).map((tag) => (typeof tag === 'string' ? tag : tag.name))
}

const detailTags = computed(() => (postDetail.value?.tags ? normalizeTags(postDetail.value.tags) : []))

async function fetchPosts() {
  loading.value = true
  error.value = null
  try {
    const res = await request<{
      message: string
      data: { posts: PostSummary[] }
    }>(`/posts?board_type=vault`, {
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

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  selectedFile.value = file
  
  // 파일 미리보기
  const reader = new FileReader()
  reader.onload = (e) => {
    formImageUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  
  // OCR 처리 시작
  await processOCR(file)
}

async function processOCR(file: File) {
  if (!file.type.startsWith('image/')) {
    ocrError.value = '이미지 파일만 OCR 처리가 가능합니다.'
    return
  }

  // 제목이 없으면 파일명 사용
  if (!formTitle.value.trim()) {
    formTitle.value = file.name.rsplit('.', 1)[0] || file.name
  }

  ocrProcessing.value = true
  ocrText.value = null
  ocrError.value = null

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', formTitle.value.trim() || file.name)

    const res = await request<{
      message: string
      data: {
        post_id: number
        ocr_text: string | null
        ocr_error: string | null
        summary: string | null
      }
    }>('/posts/upload-document', {
      method: 'POST',
      body: formData,
    })

    if (res.data?.ocr_text) {
      ocrText.value = res.data.ocr_text
      formContent.value = res.data.ocr_text
      
      if (res.data.summary) {
        aiAnalysisResult.value = {
          summary: res.data.summary
        }
      }
      
      // OCR 성공 시 자동 저장 완료
      await fetchPosts()
      if (res.data?.post_id) {
        await fetchPostDetail(res.data.post_id)
        closeWriteModal()
      }
    } else if (res.data?.ocr_error) {
      ocrError.value = res.data.ocr_error
      formContent.value = 'OCR 처리에 실패했습니다. 수동으로 내용을 입력해주세요.'
    }
  } catch (err: any) {
    console.error('OCR 처리 실패:', err)
    ocrError.value = err?.data?.error || err?.message || 'OCR 처리에 실패했습니다.'
    formContent.value = 'OCR 처리에 실패했습니다. 수동으로 내용을 입력해주세요.'
  } finally {
    ocrProcessing.value = false
  }
}

async function submitPost() {
  // 파일이 선택된 경우 OCR 처리로 이미 저장되었을 수 있음
  if (selectedFile.value && ocrProcessing.value) {
    alert('OCR 처리 중입니다. 잠시만 기다려주세요.')
    return
  }

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
        board_type: 'vault',
      },
    })

    showWriteModal.value = false
    formTitle.value = ''
    formContent.value = ''
    formImageUrl.value = null
    selectedFile.value = null
    ocrText.value = null
    ocrError.value = null
    aiAnalysisResult.value = null
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }

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

function closeWriteModal() {
  showWriteModal.value = false
  formTitle.value = ''
  formContent.value = ''
  formImageUrl.value = null
  selectedFile.value = null
  ocrText.value = null
  ocrError.value = null
  aiAnalysisResult.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
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
  }
})
</script>

<template>
  <div class="board-view">
    <div class="board-header">
      <div class="header-content">
        <h1>📁 문서 보관함</h1>
        <p class="header-description">결혼 준비 중 필요한 문서들을 모아두는 공간입니다.</p>
      </div>
      <button v-if="canWrite" class="write-btn" @click="showWriteModal = true">
        <span class="icon">✏️</span>
        <span>문서 추가</span>
      </button>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!hasPosts" class="empty-state">
      <p>아직 저장된 문서가 없습니다.</p>
      <button v-if="canWrite" class="write-btn" @click="showWriteModal = true">첫 문서 추가하기</button>
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
          <img v-if="postDetail.image_url" :src="postDetail.image_url" alt="문서 이미지" class="detail-image" />
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

    <!-- 문서 추가 모달 -->
    <div v-if="showWriteModal" class="modal-overlay" @click.self="closeWriteModal">
      <div class="modal-content">
        <h2>📄 문서 추가</h2>
        <form @submit.prevent="submitPost">
          <div class="form-group">
            <label>문서 제목 <span class="required">*</span></label>
            <input 
              v-model="formTitle" 
              type="text" 
              required 
              placeholder="예: 웨딩홀 견적서, 스드메 계약서 등"
              :disabled="ocrProcessing"
            />
          </div>
          
          <div class="form-group">
            <label>문서 파일 업로드 (OCR 자동 처리) <span class="required">*</span></label>
            <div class="file-upload-area">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*,.pdf"
                @change="handleFileSelect"
                :disabled="ocrProcessing"
                class="file-input"
              />
              <div class="file-upload-info">
                <p v-if="!selectedFile" class="file-hint">
                  📎 이미지 파일을 선택하면 자동으로 OCR 처리가 진행됩니다.<br>
                  <small>지원 형식: JPG, PNG, WEBP (최대 10MB)</small>
                </p>
                <div v-else class="file-selected">
                  <span>✅ {{ selectedFile.name }}</span>
                  <button 
                    type="button" 
                    @click="selectedFile = null; formImageUrl = null; if(fileInputRef) fileInputRef.value = ''"
                    class="remove-file-btn"
                  >
                    제거
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="ocrProcessing" class="ocr-status">
              <div class="ocr-loading">
                <span class="spinner">⏳</span>
                <span>OCR 처리 중... 문서에서 텍스트를 추출하고 있습니다.</span>
              </div>
            </div>
            
            <div v-if="ocrError" class="ocr-error">
              <span>⚠️ {{ ocrError }}</span>
            </div>
            
            <div v-if="ocrText && !ocrProcessing" class="ocr-success">
              <span>✅ OCR 완료: {{ ocrText.length }}자 추출됨</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>문서 내용 <span class="required">*</span></label>
            <textarea 
              v-model="formContent" 
              required 
              placeholder="OCR 결과가 자동으로 입력됩니다. 필요시 수정하세요." 
              rows="12"
              :disabled="ocrProcessing"
            ></textarea>
            <small class="form-hint">
              💡 OCR로 추출된 텍스트가 자동으로 입력됩니다. 필요시 수정할 수 있습니다.
            </small>
          </div>
          
          <div v-if="aiAnalysisResult?.summary" class="ai-summary">
            <label>🤖 AI 요약</label>
            <div class="summary-box">{{ aiAnalysisResult.summary }}</div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeWriteModal" :disabled="ocrProcessing">취소</button>
            <button 
              type="submit" 
              :disabled="formSubmitting || ocrProcessing || !formTitle.trim() || !formContent.trim()"
            >
              {{ ocrProcessing ? 'OCR 처리 중...' : formSubmitting ? '저장 중...' : '저장' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* PrivateSpaceView와 동일한 스타일 사용 */
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

.file-upload-area {
  border: 2px dashed var(--border, #e5e7eb);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background: var(--soft, #f9fafb);
  transition: all 0.2s;
}

.file-upload-area:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.file-input {
  display: none;
}

.file-upload-info {
  margin-top: 12px;
}

.file-hint {
  margin: 0;
  color: var(--muted, #666);
  font-size: 14px;
  line-height: 1.6;
}

.file-hint small {
  color: var(--muted, #999);
  font-size: 12px;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
}

.remove-file-btn {
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.remove-file-btn:hover {
  background: #dc2626;
}

.ocr-status {
  margin-top: 12px;
  padding: 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 6px;
}

.ocr-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #667eea;
  font-size: 14px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ocr-error {
  margin-top: 12px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  color: #ef4444;
  font-size: 14px;
}

.ocr-success {
  margin-top: 12px;
  padding: 12px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 6px;
  color: #22c55e;
  font-size: 14px;
}

.form-hint {
  display: block;
  margin-top: 4px;
  color: var(--muted, #999);
  font-size: 12px;
}

.required {
  color: #ef4444;
}

.ai-summary {
  margin-top: 20px;
  padding: 16px;
  background: var(--soft, #f9fafb);
  border-radius: 8px;
}

.ai-summary label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text, #333);
}

.summary-box {
  padding: 12px;
  background: white;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text, #666);
}
</style>

