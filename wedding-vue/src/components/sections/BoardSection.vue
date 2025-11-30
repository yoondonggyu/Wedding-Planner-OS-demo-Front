<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

type BoardType = 'couple' | 'planner' | 'private' | 'vault'

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

const tabs: { label: string; type: BoardType; description: string }[] = [
  { label: '예비부부 게시판', type: 'couple', description: '웨딩홀/스드메 후기·견적 공유' },
  { label: '플래너 리뷰', type: 'planner', description: '플래너 노하우와 시공 기록' },
  { label: '커플 전용 공간', type: 'private', description: '둘만의 비밀 노트' },
  { label: 'Document Vault', type: 'vault', description: '문서 업로드 · AI 요약' },
]

const currentTab = ref<BoardType>('couple')
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
    }>(`/posts?board_type=${currentTab.value}`, {
      method: 'GET',
    })
    posts.value = res.data?.posts ?? []
    if (posts.value.length > 0) {
      const firstPost = posts.value.find((p) => p.post_id === selectedPostId.value) ?? posts.value[0]
      selectedPostId.value = firstPost.post_id
    } else {
      selectedPostId.value = null
      postDetail.value = null
      comments.value = []
    }
  } catch (err) {
    console.error(err)
    error.value = '게시글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function switchTab(type: BoardType) {
  currentTab.value = type
}

function openWriteModal() {
  if (!canWrite.value) {
    authStore.openLoginModal()
    return
  }
  showWriteModal.value = true
}

function closeWriteModal() {
  showWriteModal.value = false
  formTitle.value = ''
  formContent.value = ''
  formImageUrl.value = null
  formSubmitting.value = false
  aiAnalysisResult.value = null
  aiAnalyzing.value = false
}

async function submitPost() {
  if (!canWrite.value) {
    authStore.openLoginModal()
    return
  }
  if (!formTitle.value.trim() || !formContent.value.trim()) {
    error.value = '제목과 내용을 입력해주세요.'
    return
  }
  formSubmitting.value = true
  try {
    await request('/posts', {
      method: 'POST',
      body: {
        title: formTitle.value,
        content: formContent.value,
        board_type: currentTab.value,
        image_url: formImageUrl.value || null,
      },
    })
    closeWriteModal()
    await fetchPosts()
  } catch (err) {
    console.error(err)
    error.value = '게시글 작성에 실패했습니다.'
  } finally {
    formSubmitting.value = false
  }
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 파일 타입 검증
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    alert('jpg, png, jpeg 파일만 업로드 가능합니다.')
    return
  }

  // 파일 크기 검증 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('파일 크기가 너무 큽니다. (최대 5MB)')
    return
  }

  imageUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await request<{ message: string; data: { image_url: string } }>('/posts/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.message === 'upload_success') {
      formImageUrl.value = res.data.image_url
      alert('이미지 업로드가 완료되었습니다.')
    }
  } catch (err) {
    console.error(err)
    alert('이미지 업로드에 실패했습니다.')
  } finally {
    imageUploading.value = false
    // input 초기화
    input.value = ''
  }
}

async function deletePost(postId: number) {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await request(`/posts/${postId}`, { method: 'DELETE' })
    if (selectedPostId.value === postId) {
      selectedPostId.value = null
      postDetail.value = null
      comments.value = []
    }
    await fetchPosts()
  } catch (err) {
    console.error(err)
    error.value = '게시글 삭제에 실패했습니다.'
  }
}

function startEditComment(comment: CommentItem) {
  comment.is_editing = true
  comment.edit_content = comment.content
}

function cancelEditComment(comment: CommentItem) {
  comment.is_editing = false
  comment.edit_content = undefined
}

async function updateComment(comment: CommentItem) {
  if (!comment.edit_content?.trim() || !selectedPostId.value) return

  try {
    await request(`/posts/${selectedPostId.value}/comments/${comment.comment_id}`, {
      method: 'PATCH',
      body: { content: comment.edit_content },
    })
    comment.content = comment.edit_content
    comment.is_editing = false
    comment.edit_content = undefined
  } catch (err) {
    console.error(err)
    error.value = '댓글 수정에 실패했습니다.'
  }
}

async function deleteComment(commentId: number) {
  if (!confirm('정말 삭제하시겠습니까?') || !selectedPostId.value) return

  try {
    await request(`/posts/${selectedPostId.value}/comments/${commentId}`, { method: 'DELETE' })
    await fetchComments(selectedPostId.value)
  } catch (err) {
    console.error(err)
    error.value = '댓글 삭제에 실패했습니다.'
  }
}

const tokenUserId = computed(() => authStore.user?.id)
const isPostOwner = computed(() => {
  return postDetail.value && tokenUserId.value && postDetail.value.user_id === tokenUserId.value
})
const isCommentOwner = (comment: CommentItem) => {
  return tokenUserId.value && comment.user_id === tokenUserId.value
}

async function fetchPostDetail(postId: number) {
  if (!postId) return
  detailLoading.value = true
  detailError.value = null
  try {
    const res = await request<{ data: PostDetail }>(`/posts/${postId}`, {
      method: 'GET',
    })
    postDetail.value = res.data
    // 조회수 증가 API 호출
    try {
      await request(`/posts/${postId}/view`, { method: 'PATCH' })
      // 조회수 업데이트
      if (postDetail.value) {
        postDetail.value.view_count = (postDetail.value.view_count || 0) + 1
      }
      posts.value = posts.value.map((post) =>
        post.post_id === postId ? { ...post, view_count: (post.view_count || 0) + 1 } : post
      )
    } catch (err) {
      console.warn('조회수 증가 실패:', err)
    }
  } catch (err) {
    console.error(err)
    detailError.value = '게시글을 불러오지 못했습니다.'
    postDetail.value = null
  } finally {
    detailLoading.value = false
  }
}

async function fetchComments(postId: number) {
  if (!postId) return
  commentsLoading.value = true
  try {
    const res = await request<{ data: { comments: CommentItem[] } }>(
      `/posts/${postId}/comments`,
      { method: 'GET' }
    )
    comments.value = res.data?.comments ?? []
  } catch (err) {
    console.error(err)
    comments.value = []
  } finally {
    commentsLoading.value = false
  }
}

function selectPost(postId: number) {
  selectedPostId.value = postId
}

async function submitComment() {
  if (!canWrite.value) {
    authStore.openLoginModal()
    return
  }
  if (!commentInput.value.trim() || !selectedPostId.value) return
  commentSubmitting.value = true
  try {
    await request(`/posts/${selectedPostId.value}/comments`, {
      method: 'POST',
      body: { content: commentInput.value },
    })
    commentInput.value = ''
    fetchComments(selectedPostId.value)
  } catch (err) {
    console.error(err)
    error.value = '댓글 작성에 실패했습니다.'
  } finally {
    commentSubmitting.value = false
  }
}

async function toggleLike() {
  if (!canWrite.value) {
    authStore.openLoginModal()
    return
  }
  if (!selectedPostId.value || likeLoading.value) return
  likeLoading.value = true
  try {
    const res = await request<{ data: { like_count: number; liked: boolean } }>(
      `/posts/${selectedPostId.value}/like`,
      { method: 'POST' }
    )
    if (postDetail.value) {
      postDetail.value.like_count = res.data.like_count
      postDetail.value.liked = res.data.liked
    }
    posts.value = posts.value.map((post) =>
      post.post_id === selectedPostId.value
        ? { ...post, like_count: res.data.like_count, liked: res.data.liked }
        : post
    )
  } catch (err) {
    console.error(err)
    error.value = '좋아요 처리에 실패했습니다.'
  } finally {
    likeLoading.value = false
  }
}

onMounted(fetchPosts)

watch(
  () => authStore.isAuthenticated,
  () => {
    fetchPosts()
  }
)

watch(currentTab, () => {
  selectedPostId.value = null
  postDetail.value = null
  comments.value = []
  fetchPosts()
})

watch(selectedPostId, (postId) => {
  if (postId) {
    fetchPostDetail(postId)
    fetchComments(postId)
  }
})
</script>

<template>
  <section class="section" id="board">
    <div class="container board-container">
      <div class="board-heading">
        <div>
          <h2>📋 웨딩 경험 데이터베이스</h2>
          <p>"웨딩 지식 그래프"의 시작. 실제 경험 데이터를 기반으로 모든 기능이 동작합니다.</p>
        </div>
        <button class="btn primary" type="button" @click="openWriteModal">✏️ 글쓰기</button>
      </div>

      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.type"
          class="tab"
          :class="{ active: currentTab === tab.type }"
          type="button"
          @click="switchTab(tab.type)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="card focus-card">
        <div>
          <h3>{{ tabs.find((tab) => tab.type === currentTab)?.label }}</h3>
          <p>{{ tabs.find((tab) => tab.type === currentTab)?.description }}</p>
        </div>
        <span class="badge">Core Data Layer</span>
      </div>

      <div v-if="error" class="card error-card">{{ error }}</div>
      <div v-else-if="loading" class="card">불러오는 중...</div>
      <template v-else>
        <div v-if="!hasPosts" class="card coming-soon">
          <h3>아직 게시글이 없습니다.</h3>
          <p>첫 번째 경험을 공유해 주세요!</p>
        </div>
        <div v-else class="board-grid">
          <div class="board-list">
            <article
              v-for="post in posts"
              :key="post.post_id"
              class="card board-card"
              :class="{ active: post.post_id === selectedPostId }"
              @click="selectPost(post.post_id)"
            >
              <div class="board-card__header">
                <div>
                  <h3>{{ post.title }}</h3>
                  <p class="meta">
                    {{ post.nickname }}
                    <span v-if="post.sentiment_label" class="sentiment">
                      ({{ post.sentiment_label }})
                    </span>
                  </p>
                </div>
                <div class="stats">
                  <span>❤️ {{ post.like_count ?? 0 }}</span>
                  <span>👁️ {{ post.view_count ?? 0 }}</span>
                  <span>💬 {{ post.comment_count ?? 0 }}</span>
                </div>
              </div>
              <div class="tag-row">
                <span v-for="tag in normalizeTags(post.tags)" :key="tag" class="chip">#{{ tag }}</span>
              </div>
              <p class="excerpt">
                {{ post.content }}
              </p>
              <div v-if="post.summary" class="summary">
                <strong>🤖 AI 요약:</strong> {{ post.summary }}
              </div>
            </article>
          </div>

          <aside class="card detail-panel">
            <template v-if="!selectedPostId">
              <p class="meta">게시글을 선택하면 상세 내용과 댓글을 볼 수 있습니다.</p>
            </template>
            <template v-else>
              <div v-if="detailLoading">상세 정보를 불러오는 중...</div>
              <div v-else-if="detailError" class="error-card">{{ detailError }}</div>
              <div v-else-if="postDetail">
                <div class="detail-header">
                  <div>
                    <h3>{{ postDetail.title }}</h3>
                    <p class="meta">{{ postDetail.nickname }}</p>
                  </div>
                  <div class="stats">
                    <span>❤️ {{ postDetail.like_count ?? 0 }}</span>
                    <span>👁️ {{ postDetail.view_count ?? 0 }}</span>
                  </div>
                </div>
                <div class="tag-row">
                  <span v-for="tag in detailTags" :key="tag" class="chip">#{{ tag }}</span>
                </div>
                <img
                  v-if="postDetail.image_url"
                  :src="postDetail.image_url"
                  alt="post"
                  class="detail-image"
                />
                <p class="detail-content">
                  {{ postDetail.content }}
                </p>
                <div v-if="postDetail.summary" class="summary">
                  <strong>🤖 AI 요약:</strong> {{ postDetail.summary }}
                </div>
                <div class="detail-actions">
                  <button class="btn" type="button" :disabled="likeLoading" @click="toggleLike">
                    {{ postDetail.liked ? '❤️ 좋아요 취소' : '🤍 좋아요' }}
                  </button>
                  <button v-if="isPostOwner" class="btn" type="button" @click="openWriteModal">
                    ✏️ 수정
                  </button>
                  <button
                    v-if="isPostOwner"
                    class="btn"
                    type="button"
                    style="background: var(--danger)"
                    @click="deletePost(postDetail.post_id)"
                  >
                    🗑️ 삭제
                  </button>
                  <button v-else class="btn" type="button" @click="openWriteModal">✏️ 새 글 쓰기</button>
                </div>

                <div class="comments">
                  <div class="comments-header">
                    <h4>💬 댓글</h4>
                    <span class="meta">{{ comments.length }}개</span>
                  </div>
                  <div v-if="commentsLoading">댓글을 불러오는 중...</div>
                  <div v-else class="comments-list">
                    <div v-for="comment in comments" :key="comment.comment_id" class="comment-item">
                      <div class="comment-header">
                        <p class="meta">{{ comment.nickname ?? '익명' }}</p>
                        <div v-if="isCommentOwner(comment)" class="comment-actions">
                          <button
                            v-if="!comment.is_editing"
                            class="btn"
                            type="button"
                            style="padding: 4px 8px; font-size: 12px"
                            @click="startEditComment(comment)"
                          >
                            수정
                          </button>
                          <button
                            v-if="!comment.is_editing"
                            class="btn"
                            type="button"
                            style="padding: 4px 8px; font-size: 12px; background: var(--danger)"
                            @click="deleteComment(comment.comment_id)"
                          >
                            삭제
                          </button>
                          <template v-else>
                            <button
                              class="btn"
                              type="button"
                              style="padding: 4px 8px; font-size: 12px"
                              @click="cancelEditComment(comment)"
                            >
                              취소
                            </button>
                            <button
                              class="btn primary"
                              type="button"
                              style="padding: 4px 8px; font-size: 12px"
                              @click="updateComment(comment)"
                            >
                              저장
                            </button>
                          </template>
                        </div>
                      </div>
                      <textarea
                        v-if="comment.is_editing"
                        v-model="comment.edit_content"
                        rows="3"
                        style="
                          width: 100%;
                          padding: 8px;
                          border-radius: 8px;
                          border: 1px solid rgba(255, 255, 255, 0.1);
                          background: var(--soft);
                          color: var(--text);
                          resize: vertical;
                        "
                      ></textarea>
                      <p v-else>{{ comment.content }}</p>
                    </div>
                    <div v-if="comments.length === 0" class="meta">첫 댓글을 남겨보세요.</div>
                  </div>
                  <div v-if="canWrite" class="comment-form">
                    <textarea
                      v-model="commentInput"
                      rows="3"
                      placeholder="댓글을 입력하세요"
                    ></textarea>
                    <button
                      class="btn primary"
                      type="button"
                      :disabled="commentSubmitting"
                      @click="submitComment"
                    >
                      {{ commentSubmitting ? '등록 중...' : '댓글 등록' }}
                    </button>
                  </div>
                  <div v-else class="meta">
                    댓글을 작성하려면 로그인이 필요합니다.
                  </div>
                </div>
              </div>
            </template>
          </aside>
        </div>
      </template>
    </div>

    <div v-if="showWriteModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>글쓰기</h3>
          <button class="btn" type="button" @click="closeWriteModal">닫기</button>
        </div>
        <div class="form-group">
          <label for="post-title">제목</label>
          <input id="post-title" v-model="formTitle" type="text" placeholder="제목을 입력하세요" />
        </div>
        <div class="form-group">
          <label for="post-content">내용</label>
          <textarea id="post-content" v-model="formContent" rows="8" placeholder="내용을 입력하세요"></textarea>
        </div>
        <div class="form-group">
          <label for="post-image">이미지 (선택)</label>
          <input
            id="post-image"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            :disabled="imageUploading"
            @change="uploadImage"
          />
          <div v-if="formImageUrl" style="margin-top: 8px">
            <img
              :src="formImageUrl"
              alt="업로드된 이미지"
              style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-top: 8px"
            />
            <button
              class="btn"
              type="button"
              style="padding: 4px 8px; font-size: 12px; margin-left: 8px"
              @click="formImageUrl = null"
            >
              제거
            </button>
          </div>
          <p v-if="imageUploading" style="color: var(--muted); font-size: 12px; margin-top: 4px">
            이미지 업로드 중...
          </p>
        </div>
        <div v-if="aiAnalysisResult" style="margin-top: 16px; padding: 12px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.2)">
          <div style="font-weight: 600; margin-bottom: 8px; color: var(--accent)">🤖 AI 분석 결과</div>
          <div v-if="aiAnalysisResult.tags && aiAnalysisResult.tags.length > 0" style="margin-bottom: 8px">
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px">예상 태그:</div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap">
              <span
                v-for="tag in aiAnalysisResult.tags"
                :key="tag"
                style="
                  font-size: 11px;
                  padding: 4px 8px;
                  background: rgba(139, 92, 246, 0.2);
                  border-radius: 4px;
                  color: var(--accent);
                "
              >
                #{{ tag }}
              </span>
            </div>
          </div>
          <div v-if="aiAnalysisResult.summary" style="margin-bottom: 8px">
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px">예상 요약:</div>
            <div style="font-size: 13px; line-height: 1.5">{{ aiAnalysisResult.summary }}</div>
          </div>
          <div v-if="aiAnalysisResult.sentiment">
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px">감성 분석:</div>
            <div style="font-size: 13px">
              {{ aiAnalysisResult.sentiment.label === 'positive' ? '긍정적' : aiAnalysisResult.sentiment.label === 'negative' ? '부정적' : '중립적' }}
              (신뢰도: {{ Math.round(aiAnalysisResult.sentiment.confidence * 100) }}%)
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" type="button" @click="closeWriteModal">취소</button>
          <button
            class="btn"
            type="button"
            :disabled="aiAnalyzing || !formContent.trim()"
            @click="analyzeWithAI"
            style="background: linear-gradient(135deg, #8b5cf6, #22d3ee); color: #0b0d12; border: none"
          >
            {{ aiAnalyzing ? 'AI 분석 중...' : '🤖 AI 기능' }}
          </button>
          <button class="btn primary" type="button" :disabled="formSubmitting" @click="submitPost">
            {{ formSubmitting ? '게시 중...' : '게시' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.board-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.board-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.board-heading h2 {
  margin: 0;
}

.board-heading p {
  color: var(--muted);
  margin: 6px 0 0;
}

.focus-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(145deg, var(--card) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.error-card {
  color: var(--danger);
}

.board-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 20px;
}

.board-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.board-card {
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.board-card.active {
  border-color: var(--accent);
}

.board-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.board-card__header h3 {
  margin: 0;
  font-size: 18px;
}

.meta {
  font-size: 13px;
  color: var(--muted);
  margin: 4px 0 0;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0;
}

.excerpt {
  color: var(--muted);
  white-space: pre-wrap;
  margin-bottom: 12px;
}

.summary {
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border-left: 3px solid var(--accent);
  font-size: 13px;
  color: var(--text);
}

.detail-panel {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.detail-image {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin: 12px 0;
}

.detail-content {
  white-space: pre-wrap;
  color: var(--text);
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.comments {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-item {
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  gap: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.tab {
  padding: 6px 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-weight: 500;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.tab.active {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: var(--accent);
  font-weight: 600;
}

.comment-form textarea {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--soft);
  color: var(--text);
  resize: vertical;
  margin-bottom: 8px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-card {
  max-width: 640px;
  width: min(640px, 95vw);
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  position: relative;
  background: var(--card);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.form-group textarea,
.form-group input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--soft);
  color: var(--text);
  font-size: 14px;
  resize: vertical;
}

@media (max-width: 1024px) {
  .board-grid {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    order: -1;
  }
}
</style>

