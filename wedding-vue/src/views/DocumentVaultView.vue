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

// 파일 분석 중 상태
const analyzingFile = ref(false)

// OCR 관련
const ocrProcessing = ref(false)
const ocrText = ref<string | null>(null)
const ocrError = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const vaultUploadInputId = `vault-upload-input-${Math.random().toString(36).slice(2)}`
const isDragging = ref(false)
const imageFileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tif', '.tiff', '.heic']
const ocrSupportedExtensions = [
  ...imageFileExtensions,
  '.pdf',
  '.xlsx',
  '.xls',
  '.csv',
  '.txt',
  '.md',
]

function getFileNameWithoutExtension(name: string) {
  const dotIndex = name.lastIndexOf('.')
  return dotIndex > 0 ? name.slice(0, dotIndex) : name
}

function isImageFile(file: File) {
  const lowerName = file.name.toLowerCase()
  return file.type.startsWith('image/') || imageFileExtensions.some((ext) => lowerName.endsWith(ext))
}

function isSupportedOcrFile(file: File) {
  const lowerName = file.name.toLowerCase()
  if (isImageFile(file)) return true
  if (file.type.includes('spreadsheet') || file.type.includes('csv') || file.type.includes('excel')) {
    return true
  }
  if (file.type.startsWith('text/')) {
    return true
  }
  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return true
  }
  return ocrSupportedExtensions.some((ext) => lowerName.endsWith(ext))
}

function isImageAttachment(url?: string | null) {
  if (!url) return false
  if (url.startsWith('data:image')) return true
  const cleanUrl = url.split('?')[0].toLowerCase()
  return imageFileExtensions.some((ext) => cleanUrl.endsWith(ext))
}

const authStore = useAuthStore()
const { request } = useApi()

// 로그인 없이도 파일 첨부 및 분석 가능하도록 수정
const canWrite = computed(() => true)
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

function clearFile() {
  selectedFile.value = null
  formImageUrl.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (!ocrProcessing.value) {
    isDragging.value = true
  }
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false

  if (ocrProcessing.value) return

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    // 모든 파일 형식 허용 (OCR 지원 여부와 관계없이 첨부 가능)
    processFile(file)
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  processFile(file)
}

async function processFile(file: File) {
  // 모든 파일 형식 허용 (OCR 지원 파일이 아니어도 첨부 가능)
  selectedFile.value = file
  
  // 파일 미리보기 (이미지인 경우에만)
  if (isImageFile(file)) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formImageUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    formImageUrl.value = null
  }
  
  // 제목이 없으면 파일명 사용
  if (!formTitle.value.trim()) {
    formTitle.value = getFileNameWithoutExtension(file.name) || file.name
  }
  
  // OCR은 자동으로 처리하지 않음 (사용자가 버튼을 눌러야 함)
  ocrText.value = null
  ocrError.value = null
}

// 파일 분석하기 (OCR + VLLM)
async function analyzeFile() {
  if (!selectedFile.value) {
    alert('파일을 먼저 선택해주세요.')
    return
  }

  const file = selectedFile.value

  if (!isSupportedOcrFile(file)) {
    ocrError.value = '지원하지 않는 파일 형식입니다. 이미지, PDF, Excel, CSV, 텍스트 파일만 분석이 가능합니다.'
    return
  }

  ocrProcessing.value = true
  analyzingFile.value = true
  ocrText.value = null
  ocrError.value = null
  aiAnalysisResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', formTitle.value.trim() || file.name)

    // OCR + VLLM 분석 API 호출
    const res = await request<{
      message: string
      data: {
        post_id: number
        ocr_text: string | null
        ocr_error: string | null
        summary: string | null
        tags?: string[]
      }
    }>('/posts/upload-document', {
      method: 'POST',
      body: formData,
    })

    if (res.data?.ocr_text) {
      ocrText.value = res.data.ocr_text
      formContent.value = res.data.ocr_text
      
      // VLLM 분석 결과 (AI 요약 및 태그)
      if (res.data.summary) {
        aiAnalysisResult.value = {
          summary: res.data.summary,
          tags: res.data.tags || []
        }
      }
    } else if (res.data?.ocr_error) {
      ocrError.value = res.data.ocr_error
      formContent.value = '파일 분석에 실패했습니다. 수동으로 내용을 입력해주세요.'
    }
  } catch (err: any) {
    console.error('파일 분석 실패:', err)
    ocrError.value = err?.data?.error || err?.message || '파일 분석에 실패했습니다.'
    formContent.value = '파일 분석에 실패했습니다. 수동으로 내용을 입력해주세요.'
  } finally {
    ocrProcessing.value = false
    analyzingFile.value = false
  }
}

// 하위 호환성을 위해 processOCR도 유지
async function processOCR() {
  await analyzeFile()
}

async function submitPost() {
  if (ocrProcessing.value) {
    alert('OCR 처리 중입니다. 잠시만 기다려주세요.')
    return
  }

  if (!formTitle.value.trim() || formSubmitting.value) {
    alert('제목을 입력해주세요.')
    return
  }

  // 내용이 없으면 경고 (파일만 첨부한 경우도 허용)
  if (!formContent.value.trim() && !selectedFile.value) {
    alert('내용을 입력하거나 파일을 첨부해주세요.')
    return
  }

  formSubmitting.value = true
  try {
    // 파일이 있는 경우 파일 업로드 API 사용
    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('title', formTitle.value.trim())
      formData.append('content', formContent.value.trim() || '')
      formData.append('board_type', 'vault')

      const res = await request<{
        message: string
        data: { post_id: number }
      }>('/posts/upload-document', {
        method: 'POST',
        body: formData,
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
    } else {
      // 파일이 없는 경우 일반 게시글 API 사용
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
  isDragging.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

onMounted(() => {
  // 로그인 없이도 문서 목록 조회 가능하도록 수정
  fetchPosts()
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  // 로그인 상태 변경 시에도 문서 목록 조회
  fetchPosts()
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
          <div v-if="postDetail.image_url" class="attachment-viewer">
            <img
              v-if="isImageAttachment(postDetail.image_url)"
              :src="postDetail.image_url"
              alt="문서 이미지"
              class="detail-image"
            />
            <a
              v-else
              class="attachment-link"
              :href="postDetail.image_url"
              target="_blank"
              rel="noopener"
            >
              📎 원본 파일 열기
            </a>
          </div>
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
            <label>문서 파일 첨부 (선택사항)</label>
            <div 
              class="file-upload-area"
              :class="{ 'has-file': selectedFile, 'dragging': isDragging }"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
            >
              <input
                ref="fileInputRef"
                :id="vaultUploadInputId"
                type="file"
                accept="*/*"
                @change="handleFileSelect"
                :disabled="ocrProcessing"
                class="file-input-overlay"
              />
              <div class="file-upload-info">
                <p v-if="!selectedFile && !isDragging" class="file-hint">
                  📎 문서 파일을 첨부할 수 있습니다.<br>
                  <label :for="vaultUploadInputId" class="file-select-link">
                    파일 선택하기
                  </label>
                  <small>모든 파일 형식 지원 (최대 10MB)</small><br>
                  <strong style="color: var(--accent, #667eea); margin-top: 8px; display: block;">클릭하거나 파일을 드래그하여 첨부</strong>
                </p>
                <p v-else-if="isDragging" class="file-hint" style="color: var(--accent, #667eea); font-weight: 600;">
                  📤 파일을 놓아주세요
                </p>
                <div v-else class="file-selected">
                  <span>✅ {{ selectedFile.name }}</span>
                  <button 
                    type="button" 
                    @click.stop="clearFile"
                    class="remove-file-btn"
                    :disabled="ocrProcessing"
                  >
                    제거
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 파일 분석하기 버튼 (OCR 지원 파일인 경우에만 표시) -->
            <div v-if="selectedFile && isSupportedOcrFile(selectedFile) && !ocrText" class="ocr-action">
              <button 
                type="button"
                @click="analyzeFile"
                :disabled="ocrProcessing"
                class="ocr-btn"
              >
                {{ ocrProcessing ? '분석 중...' : '🔍 파일 분석하기 (OCR + VLLM)' }}
              </button>
              <small class="ocr-hint">OCR로 텍스트를 추출하고 VLLM으로 문서를 분석하여 요약 및 태그를 생성합니다.</small>
            </div>
            
            <div v-if="ocrProcessing" class="ocr-status">
              <div class="ocr-loading">
                <span class="spinner">⏳</span>
                <span>파일 분석 중... OCR로 텍스트를 추출하고 VLLM으로 분석하고 있습니다.</span>
              </div>
            </div>
            
            <div v-if="ocrError" class="ocr-error">
              <span>⚠️ {{ ocrError }}</span>
            </div>
            
            <div v-if="ocrText && !ocrProcessing" class="ocr-success">
              <span>✅ 분석 완료: {{ ocrText.length }}자 추출됨</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>문서 내용 <span class="required" v-if="!selectedFile">*</span></label>
            <textarea 
              v-model="formContent" 
              :required="!selectedFile"
              placeholder="OCR 결과가 자동으로 입력되거나 수동으로 입력할 수 있습니다." 
              rows="12"
              :disabled="ocrProcessing"
            ></textarea>
            <small class="form-hint">
              💡 OCR로 추출된 텍스트가 자동으로 입력됩니다. 필요시 수정할 수 있습니다. 파일만 첨부하고 내용을 입력하지 않아도 됩니다.
            </small>
          </div>
          
          <div v-if="aiAnalysisResult?.summary" class="ai-summary">
            <label>🤖 VLLM 분석 결과</label>
            <div class="summary-box">
              <div class="summary-content">{{ aiAnalysisResult.summary }}</div>
              <div v-if="aiAnalysisResult.tags && aiAnalysisResult.tags.length > 0" class="summary-tags">
                <span class="tags-label">태그:</span>
                <span v-for="tag in aiAnalysisResult.tags" :key="tag" class="tag-badge">{{ tag }}</span>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeWriteModal" :disabled="ocrProcessing">취소</button>
            <button 
              type="submit" 
              :disabled="formSubmitting || ocrProcessing || !formTitle.trim() || (!formContent.trim() && !selectedFile)"
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

.attachment-viewer {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4f46e5;
  font-weight: 600;
  text-decoration: none;
}

.attachment-link:hover {
  text-decoration: underline;
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
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  position: relative;
}

.file-upload-area:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.file-upload-area.dragging {
  border-color: #667eea;
  border-style: solid;
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.02);
}

.file-upload-area.has-file {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.file-input-overlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
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

.file-select-link {
  display: inline-flex;
  padding: 6px 12px;
  margin: 8px 0;
  border-radius: 4px;
  background: rgba(102, 126, 234, 0.1);
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
}

.file-select-link:hover {
  text-decoration: underline;
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

.ocr-action {
  margin-top: 12px;
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.ocr-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-bottom: 8px;
}

.ocr-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.ocr-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ocr-hint {
  display: block;
  color: var(--muted, #666);
  font-size: 12px;
  margin-top: 4px;
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

.summary-content {
  margin-bottom: 12px;
}

.summary-tags {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border, #e5e7eb);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tags-label {
  font-weight: 600;
  color: var(--text, #333);
  font-size: 13px;
}

.tag-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 모바일 스타일 */
@media (max-width: 768px) {
  .board-view {
    padding: 12px;
  }

  .board-header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .header-content h1 {
    font-size: 20px;
  }

  .header-description {
    font-size: 12px;
  }

  .write-btn {
    width: 100%;
    justify-content: center;
    padding: 12px;
    font-size: 13px;
  }

  .board-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .post-card {
    padding: 12px;
  }

  .post-header h3 {
    font-size: 14px;
  }

  .post-meta {
    font-size: 11px;
    gap: 8px;
  }

  .post-content {
    font-size: 12px;
  }

  .post-footer {
    font-size: 11px;
    gap: 12px;
  }

  .post-detail {
    padding: 16px;
  }

  .detail-header h2 {
    font-size: 18px;
  }

  .detail-meta {
    font-size: 12px;
  }

  .detail-content p {
    font-size: 14px;
  }

  .action-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .comments-section h3 {
    font-size: 16px;
  }

  .comment-item {
    padding: 10px;
    gap: 8px;
  }

  .comment-author,
  .comment-content {
    font-size: 12px;
  }

  .comment-input {
    flex-direction: column;
    gap: 8px;
  }

  .comment-input input {
    padding: 10px;
    font-size: 13px;
  }

  .comment-input button {
    width: 100%;
    padding: 10px;
    font-size: 13px;
  }

  .modal-content {
    padding: 20px 16px;
    width: 95%;
    max-width: none;
  }

  .modal-content h2 {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .form-group input,
  .form-group textarea {
    padding: 10px;
    font-size: 14px;
  }

  .form-actions {
    flex-direction: column;
    gap: 8px;
  }

  .form-actions button {
    width: 100%;
    padding: 12px;
    font-size: 14px;
  }

  .file-upload-area {
    padding: 16px;
  }

  .file-hint {
    font-size: 12px;
  }

  .ocr-status,
  .ocr-loading,
  .ocr-error,
  .ocr-success {
    font-size: 12px;
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .post-card {
    padding: 10px;
  }

  .post-header h3 {
    font-size: 13px;
  }

  .post-content {
    font-size: 11px;
  }
}
</style>
