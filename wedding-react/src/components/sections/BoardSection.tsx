import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import clsx from 'clsx'
import './BoardSection.css'

type BoardType = 'couple' | 'planner' | 'venue_review'

interface PostSummary {
  post_id: number
  user_id?: number
  title: string
  content: string
  nickname: string
  created_at?: string
  tags?: { name: string }[] | string[]
  category?: string | null
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
  { label: '웨딩홀 리뷰', type: 'venue_review', description: '웨딩홀 후기 및 평가' },
]

// 제휴 업체 예약 페이지의 모든 카테고리 목록
const categories = [
  // 사진/영상
  { value: 'IPHONE_SNAP', label: '아이폰 스냅', icon: '📱' },
  { value: 'STUDIO_PREWEDDING', label: '웨딩 스튜디오', icon: '📸' },
  { value: 'WEDDING_PHOTO', label: '웨딩 사진', icon: '📷' },
  { value: 'VIDEO', label: '웨딩 영상', icon: '🎬' },
  // 웨딩홀/장소
  { value: 'WEDDING_HALL', label: '웨딩홀', icon: '🏛️' },
  { value: 'VENUE_INDOOR', label: '실내 식장', icon: '🏢' },
  { value: 'VENUE_OUTDOOR', label: '야외 식장', icon: '🏞️' },
  { value: 'VENUE_COMPLEX', label: '복합 식장', icon: '🏰' },
  // 플래너/기획
  { value: 'PLANNER', label: '웨딩 플래너', icon: '📅' },
  { value: 'COORDINATOR', label: '웨딩 코디네이터', icon: '🎯' },
  // 패션/뷰티
  { value: 'DRESS_SHOP', label: '드레스샵', icon: '👗' },
  { value: 'SUIT_SHOP', label: '턱시도샵', icon: '🤵' },
  { value: 'MAKEUP_HAIR', label: '메이크업/헤어', icon: '💄' },
  { value: 'BEAUTY_SALON', label: '뷰티 살롱', icon: '💅' },
  // 음식/케이터링
  { value: 'CATERING', label: '케이터링', icon: '🍽️' },
  { value: 'BUFFET', label: '뷔페/식당', icon: '🍴' },
  { value: 'CAKE', label: '케이크/디저트', icon: '🎂' },
  { value: 'BAR', label: '바/음료', icon: '🍷' },
  // 꽃/장식
  { value: 'FLORIST', label: '꽃/플로리스트', icon: '🌸' },
  { value: 'DECORATION', label: '장식/데코', icon: '🎨' },
  { value: 'BOUQUET', label: '부케/꽃다발', icon: '💐' },
  // 예물/주얼리
  { value: 'JEWELRY', label: '예물/주얼리', icon: '💍' },
  { value: 'RING', label: '예물/반지', icon: '💎' },
  // 교통/운송
  { value: 'WEDDING_CAR', label: '웨딩카', icon: '🚗' },
  { value: 'LIMOUSINE', label: '리무진', icon: '🚙' },
  { value: 'TRANSPORTATION', label: '교통/운송', icon: '🚌' },
  // 기타
  { value: 'MC', label: '사회자', icon: '🎤' },
  { value: 'SINGER', label: '축가', icon: '🎵' },
  { value: 'BAND', label: '밴드/연주자', icon: '🎸' },
  { value: 'MUSIC', label: '축가/연주', icon: '🎼' },
  { value: 'INVITATION', label: '청첩장/인쇄', icon: '💌' },
  { value: 'GIFT', label: '웨딩선물/답례품', icon: '🎁' },
  { value: 'HOTEL', label: '호텔/숙박', icon: '🏨' },
  { value: 'WEDDING_FAIR', label: '웨딩박람회', icon: '🎪' },
  { value: 'HANBOK', label: '한복', icon: '🎎' },
  { value: 'HONEYMOON', label: '신혼여행', icon: '✈️' },
]

export default function BoardSection() {
  const [currentTab, setCurrentTab] = useState<BoardType>('couple')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [postDetail, setPostDetail] = useState<PostDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  const [likeLoading, setLikeLoading] = useState(false)

  const [showWriteModal, setShowWriteModal] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null)
  const [formCategory, setFormCategory] = useState('')
  const [formCustomCategory, setFormCustomCategory] = useState('')
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    tags?: string[]
    summary?: string
    sentiment?: { label: string; confidence: number }
  } | null>(null)

  const authStore = useAuthStore()
  const { request } = useApi()
  const { showError: showToastError, showSuccess: showToastSuccess } = useToast()

  const canWrite = useMemo(() => authStore.isAuthenticated, [authStore.isAuthenticated])
  const hasPosts = useMemo(() => posts.length > 0, [posts.length])

  // 카테고리별 필터링된 게시글
  const filteredPosts = useMemo(() => {
    if (!selectedCategory) {
      return posts
    }
    return posts.filter(post => post.category === selectedCategory)
  }, [posts, selectedCategory])

  function normalizeTags(tags?: { name: string }[] | string[]) {
    return (tags ?? []).map((tag) => (typeof tag === 'string' ? tag : tag.name))
  }

  const detailTags = useMemo(() => (postDetail?.tags ? normalizeTags(postDetail.tags) : []), [postDetail?.tags])

  // 카테고리 코드를 한글 라벨로 변환
  function getCategoryLabel(categoryCode?: string | null): string {
    if (!categoryCode) return ''
    const category = categories.find(c => c.value === categoryCode)
    return category ? `${category.icon} ${category.label}` : categoryCode
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await request<{
        message: string
        data: { posts: PostSummary[] }
      }>(`/posts?board_type=${currentTab}`, {
        method: 'GET',
      })
      setPosts(res.data?.posts ?? [])
      if (res.data?.posts && res.data.posts.length > 0) {
        const firstPost = res.data.posts.find((p) => p.post_id === selectedPostId) ?? res.data.posts[0]
        setSelectedPostId(firstPost.post_id)
      } else {
        setSelectedPostId(null)
        setPostDetail(null)
        setComments([])
      }
    } catch (err) {
      console.error(err)
      setError('게시글을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [currentTab, selectedPostId, request])

  const switchTab = useCallback((type: BoardType) => {
    setCurrentTab(type)
  }, [])

  const openWriteModal = useCallback(() => {
    if (!canWrite) {
      authStore.openLoginModal()
      return
    }
    setShowWriteModal(true)
  }, [canWrite, authStore])

  const closeWriteModal = useCallback(() => {
    setShowWriteModal(false)
    setFormTitle('')
    setFormContent('')
    setFormImageUrl(null)
    setFormCategory('')
    setFormCustomCategory('')
    setShowCustomCategoryInput(false)
    setFormSubmitting(false)
    setAiAnalysisResult(null)
    setAiAnalyzing(false)
  }, [])

  const submitPost = useCallback(async () => {
    if (!canWrite) {
      authStore.openLoginModal()
      return
    }
    if (!formTitle.trim() || !formContent.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }
    
    // 카테고리 선택 확인
    const selectedCategoryValue = showCustomCategoryInput && formCustomCategory.trim()
      ? formCustomCategory.trim()
      : formCategory
      
    if (!selectedCategoryValue) {
      setError('카테고리를 선택하거나 직접 입력해주세요.')
      return
    }
    
    setFormSubmitting(true)
    try {
      await request('/posts', {
        method: 'POST',
        body: {
          title: formTitle,
          content: formContent,
          board_type: currentTab,
          image_url: formImageUrl || null,
          category: selectedCategoryValue,
        },
      })
      closeWriteModal()
      await fetchPosts()
    } catch (err) {
      console.error(err)
      setError('게시글 작성에 실패했습니다.')
    } finally {
      setFormSubmitting(false)
    }
  }, [canWrite, formTitle, formContent, formCategory, formCustomCategory, showCustomCategoryInput, formImageUrl, currentTab, authStore, request, closeWriteModal, fetchPosts])

  const uploadImage = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      showToastError('jpg, png, jpeg 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToastError('파일 크기가 너무 큽니다. (최대 5MB)')
      return
    }

    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await request<{ message: string; data: { image_url: string } }>('/posts/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.message === 'upload_success') {
        setFormImageUrl(res.data.image_url)
        showToastSuccess('이미지 업로드가 완료되었습니다.')
      }
    } catch (err) {
      console.error(err)
      showToastError('이미지 업로드에 실패했습니다.')
    } finally {
      setImageUploading(false)
      // input 초기화
      input.value = ''
    }
  }, [request, showToastError, showToastSuccess])

  const deletePost = useCallback(async (postId: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await request(`/posts/${postId}`, { method: 'DELETE' })
      if (selectedPostId === postId) {
        setSelectedPostId(null)
        setPostDetail(null)
        setComments([])
      }
      await fetchPosts()
    } catch (err) {
      console.error(err)
      setError('게시글 삭제에 실패했습니다.')
    }
  }, [selectedPostId, request, fetchPosts])

  const startEditComment = useCallback((comment: CommentItem) => {
    setComments(prev => prev.map(c => 
      c.comment_id === comment.comment_id 
        ? { ...c, is_editing: true, edit_content: c.content }
        : c
    ))
  }, [])

  const cancelEditComment = useCallback((comment: CommentItem) => {
    setComments(prev => prev.map(c => 
      c.comment_id === comment.comment_id 
        ? { ...c, is_editing: false, edit_content: undefined }
        : c
    ))
  }, [])

  const updateComment = useCallback(async (comment: CommentItem) => {
    if (!comment.edit_content?.trim() || !selectedPostId) return

    try {
      await request(`/posts/${selectedPostId}/comments/${comment.comment_id}`, {
        method: 'PATCH',
        body: { content: comment.edit_content },
      })
      setComments(prev => prev.map(c => 
        c.comment_id === comment.comment_id 
          ? { ...c, content: comment.edit_content!, is_editing: false, edit_content: undefined }
          : c
      ))
    } catch (err) {
      console.error(err)
      setError('댓글 수정에 실패했습니다.')
    }
  }, [selectedPostId, request])

  const deleteComment = useCallback(async (commentId: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?') || !selectedPostId) return

    try {
      await request(`/posts/${selectedPostId}/comments/${commentId}`, { method: 'DELETE' })
      await fetchComments(selectedPostId)
    } catch (err) {
      console.error(err)
      setError('댓글 삭제에 실패했습니다.')
    }
  }, [selectedPostId, request])

  const tokenUserId = useMemo(() => authStore.user?.id, [authStore.user?.id])
  const isPostOwner = useMemo(() => {
    return postDetail && tokenUserId && postDetail.user_id === tokenUserId
  }, [postDetail, tokenUserId])
  const isCommentOwner = useCallback((comment: CommentItem) => {
    return tokenUserId && comment.user_id === tokenUserId
  }, [tokenUserId])

  const fetchPostDetail = useCallback(async (postId: number) => {
    if (!postId) return
    
    // 비회원은 상세 조회 불가
    if (!authStore.isAuthenticated) {
      authStore.openLoginModal()
      return
    }
    
    setDetailLoading(true)
    setDetailError(null)
    try {
      const res = await request<{ data: PostDetail }>(`/posts/${postId}`, {
        method: 'GET',
      })
      setPostDetail(res.data)
      // 조회수 증가 API 호출
      try {
        await request(`/posts/${postId}/view`, { method: 'PATCH' })
        // 조회수 업데이트
        setPostDetail(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : null)
        setPosts(prev => prev.map((post) =>
          post.post_id === postId ? { ...post, view_count: (post.view_count || 0) + 1 } : post
        ))
      } catch (err) {
        console.warn('조회수 증가 실패:', err)
      }
    } catch (err: any) {
      console.error(err)
      // 403 Forbidden 에러인 경우 로그인 요청
      if (err?.status === 403 || err?.data?.error?.includes('로그인')) {
        authStore.openLoginModal()
        setDetailError('로그인이 필요한 기능입니다.')
      } else {
        setDetailError('게시글을 불러오지 못했습니다.')
      }
      setPostDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [authStore, request])

  const fetchComments = useCallback(async (postId: number) => {
    if (!postId) return
    setCommentsLoading(true)
    try {
      const res = await request<{ data: { comments: CommentItem[] } }>(
        `/posts/${postId}/comments`,
        { method: 'GET' }
      )
      setComments(res.data?.comments ?? [])
    } catch (err) {
      console.error(err)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [request])

  const selectPost = useCallback((postId: number) => {
    setSelectedPostId(postId)
  }, [])

  const submitComment = useCallback(async () => {
    if (!canWrite) {
      authStore.openLoginModal()
      return
    }
    if (!commentInput.trim() || !selectedPostId) return
    setCommentSubmitting(true)
    try {
      await request(`/posts/${selectedPostId}/comments`, {
        method: 'POST',
        body: { content: commentInput },
      })
      setCommentInput('')
      await fetchComments(selectedPostId)
    } catch (err) {
      console.error(err)
      setError('댓글 작성에 실패했습니다.')
    } finally {
      setCommentSubmitting(false)
    }
  }, [canWrite, commentInput, selectedPostId, authStore, request, fetchComments])

  const toggleLike = useCallback(async () => {
    if (!canWrite) {
      authStore.openLoginModal()
      return
    }
    if (!selectedPostId || likeLoading) return
    setLikeLoading(true)
    try {
      const res = await request<{ data: { like_count: number; liked: boolean } }>(
        `/posts/${selectedPostId}/like`,
        { method: 'POST' }
      )
      setPostDetail(prev => prev ? { ...prev, like_count: res.data.like_count, liked: res.data.liked } : null)
      setPosts(prev => prev.map((post) =>
        post.post_id === selectedPostId
          ? { ...post, like_count: res.data.like_count, liked: res.data.liked }
          : post
      ))
    } catch (err) {
      console.error(err)
      setError('좋아요 처리에 실패했습니다.')
    } finally {
      setLikeLoading(false)
    }
  }, [canWrite, selectedPostId, likeLoading, authStore, request])

  const analyzeWithAI = useCallback(async () => {
    if (!formContent.trim()) {
      setError('내용을 먼저 입력해주세요.')
      return
    }
    
    setAiAnalyzing(true)
    setAiAnalysisResult(null)
    
    try {
      const res = await request<{
        data: {
          tags?: string[]
          summary?: string
          sentiment?: { label: string; confidence: number }
        }
      }>('/posts/analyze', {
        method: 'POST',
        body: {
          content: formContent,
        },
      })
      
      setAiAnalysisResult(res.data || {})
    } catch (err) {
      console.error(err)
      setError('AI 분석에 실패했습니다.')
    } finally {
      setAiAnalyzing(false)
    }
  }, [formContent, request])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    if (authStore.isAuthenticated) {
      fetchPosts()
    }
  }, [authStore.isAuthenticated, fetchPosts])

  useEffect(() => {
    setSelectedPostId(null)
    setPostDetail(null)
    setComments([])
    setSelectedCategory(null) // 탭 변경 시 카테고리 필터 초기화
    fetchPosts()
  }, [currentTab, fetchPosts])

  useEffect(() => {
    // 카테고리 필터 변경 시 선택된 게시글 초기화
    if (selectedCategory) {
      setSelectedPostId(null)
      setPostDetail(null)
      setComments([])
    }
  }, [selectedCategory])

  useEffect(() => {
    if (selectedPostId) {
      fetchPostDetail(selectedPostId)
      fetchComments(selectedPostId)
    }
  }, [selectedPostId, fetchPostDetail, fetchComments])

  const currentTabInfo = useMemo(() => tabs.find((tab) => tab.type === currentTab), [currentTab])

  return (
    <section className="section" id="board">
      <div className="container board-container">
        <div className="board-heading">
          <div>
            <h2>📋 웨딩 경험 데이터베이스</h2>
            <p>"웨딩 지식 그래프"의 시작. 실제 경험 데이터를 기반으로 모든 기능이 동작합니다.</p>
          </div>
          <button className="btn primary" type="button" onClick={openWriteModal}>✏️ 글쓰기</button>
        </div>

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              className={clsx('tab', { active: currentTab === tab.type })}
              type="button"
              onClick={() => switchTab(tab.type)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card focus-card">
          <div>
            <h3>{currentTabInfo?.label}</h3>
            <p>{currentTabInfo?.description}</p>
          </div>
          <span className="badge">Core Data Layer</span>
        </div>

        {/* 카테고리 필터 */}
        <div className="category-filter-section">
          <div className="category-filter-header">
            <label style={{ fontWeight: 600, color: 'var(--text)', marginRight: '12px' }}>카테고리 필터:</label>
            <button
              className={clsx('category-filter-btn', { active: !selectedCategory })}
              onClick={() => setSelectedCategory(null)}
            >
              전체
            </button>
            <div className="category-filter-group">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  className={clsx('category-filter-btn', { active: selectedCategory === cat.value })}
                  onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
          {selectedCategory && (
            <div className="category-filter-info">
              <span>{getCategoryLabel(selectedCategory)} 카테고리만 표시 중</span>
              <button className="clear-filter-btn" onClick={() => setSelectedCategory(null)}>✕ 필터 해제</button>
            </div>
          )}
        </div>

        {error && <div className="card error-card">{error}</div>}
        {loading && <div className="card">불러오는 중...</div>}
        {!loading && !error && (
          <>
            {filteredPosts.length === 0 ? (
              <div className="card coming-soon">
                <h3>{selectedCategory ? '선택한 카테고리에 해당하는 게시글이 없습니다.' : '아직 게시글이 없습니다.'}</h3>
                <p>첫 번째 경험을 공유해 주세요!</p>
              </div>
            ) : (
              <div className="board-grid">
                <div className="board-list">
                  {filteredPosts.map((post) => (
                    <article
                      key={post.post_id}
                      className={clsx('card board-card', { active: post.post_id === selectedPostId })}
                      onClick={() => selectPost(post.post_id)}
                    >
                      <div className="board-card__header">
                        <div>
                          <h3>{post.title}</h3>
                          <p className="meta">
                            {post.nickname}
                            {post.sentiment_label && (
                              <span className="sentiment">
                                ({post.sentiment_label})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="stats">
                          <span>❤️ {post.like_count ?? 0}</span>
                          <span>👁️ {post.view_count ?? 0}</span>
                          <span>💬 {post.comment_count ?? 0}</span>
                        </div>
                      </div>
                      {post.category && (
                        <div className="category-badge">
                          <span className="category-label">{getCategoryLabel(post.category)}</span>
                        </div>
                      )}
                      <div className="tag-row">
                        {normalizeTags(post.tags).map((tag) => (
                          <span key={tag} className="chip">#{tag}</span>
                        ))}
                      </div>
                      <p className="excerpt">
                        {post.content}
                      </p>
                      {post.summary && (
                        <div className="summary">
                          <strong>🤖 AI 요약:</strong> {post.summary}
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                <aside className="card detail-panel">
                  {!selectedPostId ? (
                    <p className="meta">게시글을 선택하면 상세 내용과 댓글을 볼 수 있습니다.</p>
                  ) : (
                    <>
                      {detailLoading ? (
                        <div>상세 정보를 불러오는 중...</div>
                      ) : detailError ? (
                        <div className="error-card">{detailError}</div>
                      ) : postDetail ? (
                        <>
                          <div className="detail-header">
                            <div>
                              <h3>{postDetail.title}</h3>
                              <p className="meta">{postDetail.nickname}</p>
                            </div>
                            <div className="stats">
                              <span>❤️ {postDetail.like_count ?? 0}</span>
                              <span>👁️ {postDetail.view_count ?? 0}</span>
                            </div>
                          </div>
                          {postDetail.category && (
                            <div className="category-badge">
                              <span className="category-label">{getCategoryLabel(postDetail.category)}</span>
                            </div>
                          )}
                          <div className="tag-row">
                            {detailTags.map((tag) => (
                              <span key={tag} className="chip">#{tag}</span>
                            ))}
                          </div>
                          {postDetail.image_url && (
                            <img
                              src={postDetail.image_url}
                              alt="post"
                              className="detail-image"
                            />
                          )}
                          <p className="detail-content">
                            {postDetail.content}
                          </p>
                          {postDetail.summary && (
                            <div className="summary">
                              <strong>🤖 AI 요약:</strong> {postDetail.summary}
                            </div>
                          )}
                          <div className="detail-actions">
                            <button className="btn" type="button" disabled={likeLoading} onClick={toggleLike}>
                              {postDetail.liked ? '❤️ 좋아요 취소' : '🤍 좋아요'}
                            </button>
                            {isPostOwner && (
                              <>
                                <button className="btn" type="button" onClick={openWriteModal}>
                                  ✏️ 수정
                                </button>
                                <button
                                  className="btn"
                                  type="button"
                                  style={{ background: 'var(--danger)' }}
                                  onClick={() => deletePost(postDetail.post_id)}
                                >
                                  🗑️ 삭제
                                </button>
                              </>
                            )}
                            {!isPostOwner && (
                              <button className="btn" type="button" onClick={openWriteModal}>✏️ 새 글 쓰기</button>
                            )}
                          </div>

                          <div className="comments">
                            <div className="comments-header">
                              <h4>💬 댓글</h4>
                              <span className="meta">{comments.length}개</span>
                            </div>
                            {commentsLoading ? (
                              <div>댓글을 불러오는 중...</div>
                            ) : (
                              <div className="comments-list">
                                {comments.map((comment) => (
                                  <div key={comment.comment_id} className="comment-item">
                                    <div className="comment-header">
                                      <p className="meta">{comment.nickname ?? '익명'}</p>
                                      {isCommentOwner(comment) && (
                                        <div className="comment-actions">
                                          {!comment.is_editing ? (
                                            <>
                                              <button
                                                className="btn"
                                                type="button"
                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                                onClick={() => startEditComment(comment)}
                                              >
                                                수정
                                              </button>
                                              <button
                                                className="btn"
                                                type="button"
                                                style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--danger)' }}
                                                onClick={() => deleteComment(comment.comment_id)}
                                              >
                                                삭제
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                className="btn"
                                                type="button"
                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                                onClick={() => cancelEditComment(comment)}
                                              >
                                                취소
                                              </button>
                                              <button
                                                className="btn primary"
                                                type="button"
                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                                onClick={() => updateComment(comment)}
                                              >
                                                저장
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {comment.is_editing ? (
                                      <textarea
                                        value={comment.edit_content || ''}
                                        onChange={(e) => {
                                          setComments(prev => prev.map(c => 
                                            c.comment_id === comment.comment_id 
                                              ? { ...c, edit_content: e.target.value }
                                              : c
                                          ))
                                        }}
                                        rows={3}
                                        style={{
                                          width: '100%',
                                          padding: '8px',
                                          borderRadius: '8px',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          background: 'var(--soft)',
                                          color: 'var(--text)',
                                          resize: 'vertical',
                                        }}
                                      />
                                    ) : (
                                      <p>{comment.content}</p>
                                    )}
                                  </div>
                                ))}
                                {comments.length === 0 && <div className="meta">첫 댓글을 남겨보세요.</div>}
                              </div>
                            )}
                            {canWrite ? (
                              <div className="comment-form">
                                <textarea
                                  value={commentInput}
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  rows={3}
                                  placeholder="댓글을 입력하세요"
                                />
                                <button
                                  className="btn primary"
                                  type="button"
                                  disabled={commentSubmitting}
                                  onClick={submitComment}
                                >
                                  {commentSubmitting ? '등록 중...' : '댓글 등록'}
                                </button>
                              </div>
                            ) : (
                              <div className="meta">
                                댓글을 작성하려면 로그인이 필요합니다.
                              </div>
                            )}
                          </div>
                        </>
                      ) : null}
                    </>
                  )}
                </aside>
              </div>
            )}
          </>
        )}
      </div>

      {showWriteModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeWriteModal()
          }
        }}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>글쓰기</h3>
              <button className="btn" type="button" onClick={closeWriteModal}>닫기</button>
            </div>
            <div className="form-group">
              <label htmlFor="post-title">제목</label>
              <input 
                id="post-title" 
                value={formTitle} 
                onChange={(e) => setFormTitle(e.target.value)}
                type="text" 
                placeholder="제목을 입력하세요" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="post-content">내용</label>
              <textarea 
                id="post-content" 
                value={formContent} 
                onChange={(e) => setFormContent(e.target.value)}
                rows={8} 
                placeholder="내용을 입력하세요"
              />
            </div>
            <div className="form-group">
              <label htmlFor="post-category">카테고리 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select 
                  id="post-category" 
                  value={formCategory} 
                  onChange={(e) => setFormCategory(e.target.value)}
                  disabled={showCustomCategoryInput}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'var(--soft)', color: 'var(--text)', fontSize: '14px' }}
                >
                  <option value="">카테고리를 선택하세요</option>
                  <optgroup label="사진/영상">
                    {categories.filter(c => ['IPHONE_SNAP', 'STUDIO_PREWEDDING', 'WEDDING_PHOTO', 'VIDEO'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="웨딩홀/장소">
                    {categories.filter(c => ['WEDDING_HALL', 'VENUE_INDOOR', 'VENUE_OUTDOOR', 'VENUE_COMPLEX'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="플래너/기획">
                    {categories.filter(c => ['PLANNER', 'COORDINATOR'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="패션/뷰티">
                    {categories.filter(c => ['DRESS_SHOP', 'SUIT_SHOP', 'MAKEUP_HAIR', 'BEAUTY_SALON'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="음식/케이터링">
                    {categories.filter(c => ['CATERING', 'BUFFET', 'CAKE', 'BAR'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="꽃/장식">
                    {categories.filter(c => ['FLORIST', 'DECORATION', 'BOUQUET'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="예물/주얼리">
                    {categories.filter(c => ['JEWELRY', 'RING'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="교통/운송">
                    {categories.filter(c => ['WEDDING_CAR', 'LIMOUSINE', 'TRANSPORTATION'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="기타">
                    {categories.filter(c => ['MC', 'SINGER', 'BAND', 'MUSIC', 'INVITATION', 'GIFT', 'HOTEL', 'WEDDING_FAIR', 'HANBOK', 'HONEYMOON'].includes(c.value)).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="custom-category-checkbox"
                    checked={showCustomCategoryInput}
                    onChange={(e) => setShowCustomCategoryInput(e.target.checked)}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="custom-category-checkbox" style={{ fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>직접 입력</label>
                </div>
                {showCustomCategoryInput && (
                  <input 
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    type="text" 
                    placeholder="카테고리를 직접 입력하세요"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'var(--soft)', color: 'var(--text)', fontSize: '14px' }}
                  />
                )}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="post-image">이미지 (선택)</label>
              <input
                id="post-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                disabled={imageUploading}
                onChange={uploadImage}
              />
              {formImageUrl && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={formImageUrl}
                    alt="업로드된 이미지"
                    style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginTop: '8px' }}
                  />
                  <button
                    className="btn"
                    type="button"
                    style={{ padding: '4px 8px', fontSize: '12px', marginLeft: '8px' }}
                    onClick={() => setFormImageUrl(null)}
                  >
                    제거
                  </button>
                </div>
              )}
              {imageUploading && (
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px' }}>
                  이미지 업로드 중...
                </p>
              )}
            </div>
            {aiAnalysisResult && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent)' }}>🤖 AI 분석 결과</div>
                {aiAnalysisResult.tags && aiAnalysisResult.tags.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>예상 태그:</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {aiAnalysisResult.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: 'rgba(139, 92, 246, 0.2)',
                            borderRadius: '4px',
                            color: 'var(--accent)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {aiAnalysisResult.summary && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>예상 요약:</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{aiAnalysisResult.summary}</div>
                  </div>
                )}
                {aiAnalysisResult.sentiment && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>감성 분석:</div>
                    <div style={{ fontSize: '13px' }}>
                      {aiAnalysisResult.sentiment.label === 'positive' ? '긍정적' : aiAnalysisResult.sentiment.label === 'negative' ? '부정적' : '중립적'}
                      (신뢰도: {Math.round(aiAnalysisResult.sentiment.confidence * 100)}%)
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn" type="button" onClick={closeWriteModal}>취소</button>
              <button
                className="btn"
                type="button"
                disabled={aiAnalyzing || !formContent.trim()}
                onClick={analyzeWithAI}
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', color: '#0b0d12', border: 'none' }}
              >
                {aiAnalyzing ? 'AI 분석 중...' : '🤖 AI 기능'}
              </button>
              <button className="btn primary" type="button" disabled={formSubmitting} onClick={submitPost}>
                {formSubmitting ? '게시 중...' : '게시'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

