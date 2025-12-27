import React, { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import CoupleInviteModal from '@/components/modals/CoupleInviteModal'
import clsx from 'clsx'
import './PrivateSpaceView.css'

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

export default function PrivateSpaceView() {
  const authStore = useAuthStore()
  const { request } = useApi()

  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [postDetail, setPostDetail] = useState<PostDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  const [likeLoading, setLikeLoading] = useState(false)

  const [showWriteModal, setShowWriteModal] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const [isCoupleConnected, setIsCoupleConnected] = useState(false)
  const [showCoupleModal, setShowCoupleModal] = useState(false)
  const [coupleKey, setCoupleKey] = useState<string | null>(null)
  const [userGender, setUserGender] = useState<'BRIDE' | 'GROOM' | null>(null)
  const [checkingCoupleStatus, setCheckingCoupleStatus] = useState(false)

  const canWrite = useMemo(() => authStore.isAuthenticated, [authStore.isAuthenticated])
  const hasPosts = useMemo(() => posts.length > 0, [posts])

  const checkCoupleConnection = async () => {
    if (!authStore.isAuthenticated) {
      return false
    }

    setCheckingCoupleStatus(true)
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
        setIsCoupleConnected(true)
        return true
      } else {
        const myKey = await request<{
          message: string
          data: {
            couple_key?: string
            gender?: string
            is_connected?: boolean
          }
        }>('/couple/my-key')

        if (myKey.data?.couple_key && myKey.data?.gender) {
          setCoupleKey(myKey.data.couple_key)
          setUserGender(myKey.data.gender as 'BRIDE' | 'GROOM')
          setShowCoupleModal(true)
        } else {
          alert('커플 기능을 사용하려면 회원가입 시 성별을 선택해주세요.')
        }
        setIsCoupleConnected(false)
        return false
      }
    } catch (err: any) {
      console.error('커플 연결 상태 확인 실패:', err)
      setIsCoupleConnected(false)
      return false
    } finally {
      setCheckingCoupleStatus(false)
    }
  }

  const fetchPosts = async () => {
    const connected = await checkCoupleConnection()
    if (!connected) {
      setPosts([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await request<{
        message: string
        data: { posts: PostSummary[] }
      }>(`/posts?board_type=private`, {
        method: 'GET',
      })
      setPosts(res.data?.posts ?? [])
      if (res.data?.posts && res.data.posts.length > 0) {
        const firstPost = res.data.posts.find((p) => p.post_id === selectedPostId) ?? res.data.posts[0]
        await fetchPostDetail(firstPost.post_id)
      } else {
        setSelectedPostId(null)
        setPostDetail(null)
      }
    } catch (err: any) {
      console.error('게시글 목록 로드 실패:', err)
      setError(err?.data?.error || err?.message || '게시글을 불러올 수 없습니다.')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCoupleConnected = () => {
    setShowCoupleModal(false)
    setTimeout(() => {
      fetchPosts()
    }, 500)
  }

  const fetchPostDetail = async (postId: number) => {
    if (selectedPostId === postId && postDetail) {
      return
    }

    setDetailLoading(true)
    setDetailError(null)
    setSelectedPostId(postId)

    try {
      const res = await request<{
        message: string
        data: PostDetail
      }>(`/posts/${postId}`, {
        method: 'GET',
      })

      setPostDetail(res.data)
      setComments(res.data.comments ?? [])
    } catch (err: any) {
      console.error('게시글 상세 로드 실패:', err)
      setDetailError(err?.data?.error || err?.message || '게시글을 불러올 수 없습니다.')
      setPostDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleLike = async (postId: number) => {
    if (likeLoading) return

    setLikeLoading(true)
    try {
      const res = await request<{
        message: string
        data: { like_count: number; liked: boolean }
      }>(`/posts/${postId}/like`, {
        method: 'POST',
      })

      if (postDetail && postDetail.post_id === postId) {
        setPostDetail({ ...postDetail, like_count: res.data.like_count, liked: res.data.liked })
      }

      setPosts(
        posts.map((p) => (p.post_id === postId ? { ...p, like_count: res.data.like_count, liked: res.data.liked } : p))
      )
    } catch (err: any) {
      console.error('좋아요 실패:', err)
      alert(err?.data?.error || err?.message || '좋아요 처리에 실패했습니다.')
    } finally {
      setLikeLoading(false)
    }
  }

  const submitComment = async () => {
    if (!commentInput.trim() || !selectedPostId || commentSubmitting) return

    setCommentSubmitting(true)
    try {
      const res = await request<{
        message: string
        data: CommentItem
      }>(`/posts/${selectedPostId}/comments`, {
        method: 'POST',
        body: {
          content: commentInput.trim(),
        },
      })

      setComments([...comments, res.data])
      setCommentInput('')

      if (postDetail) {
        setPostDetail({ ...postDetail, comment_count: (postDetail.comment_count || 0) + 1 })
      }
    } catch (err: any) {
      console.error('댓글 작성 실패:', err)
      alert(err?.data?.error || err?.message || '댓글 작성에 실패했습니다.')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const submitPost = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (!formTitle.trim() || !formContent.trim() || formSubmitting) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    setFormSubmitting(true)
    try {
      const res = await request<{
        message: string
        data: { post_id: number }
      }>('/posts', {
        method: 'POST',
        body: {
          title: formTitle.trim(),
          content: formContent.trim(),
          image_url: formImageUrl || null,
          board_type: 'private',
        },
      })

      setShowWriteModal(false)
      setFormTitle('')
      setFormContent('')
      setFormImageUrl(null)

      await fetchPosts()
      if (res.data?.post_id) {
        await fetchPostDetail(res.data.post_id)
      }
    } catch (err: any) {
      console.error('게시글 작성 실패:', err)
      alert(err?.data?.error || err?.message || '게시글 작성에 실패했습니다.')
    } finally {
      setFormSubmitting(false)
    }
  }

  useEffect(() => {
    if (authStore.isAuthenticated) {
      fetchPosts()
    }
  }, [authStore.isAuthenticated])

  if (checkingCoupleStatus) {
    return (
      <div className="board-view">
        <div className="loading">커플 연결 상태 확인 중...</div>
      </div>
    )
  }

  if (!isCoupleConnected) {
    return (
      <div className="board-view">
        <div className="empty-state">
          <div className="couple-required-message">
            <h2>💑 커플 등록이 필요합니다</h2>
            <p>우리만의 공간을 사용하려면 먼저 커플을 등록해주세요.</p>
            <button className="write-btn" onClick={() => setShowCoupleModal(true)}>
              <span className="icon">💕</span>
              <span>커플 등록하기</span>
            </button>
          </div>
        </div>
        {showCoupleModal && (
          <CoupleInviteModal
            show={showCoupleModal}
            coupleKey={coupleKey}
            gender={userGender}
            onClose={() => setShowCoupleModal(false)}
            onConnected={handleCoupleConnected}
          />
        )}
      </div>
    )
  }

  return (
    <div className="board-view">
      <div className="board-header">
        <div className="header-content">
          <h1>💑 우리만의 공간</h1>
          <p className="header-description">둘만의 비밀 노트와 기록을 남기는 공간입니다.</p>
        </div>
        {canWrite && (
          <button className="write-btn" onClick={() => setShowWriteModal(true)}>
            <span className="icon">✏️</span>
            <span>글쓰기</span>
          </button>
        )}
      </div>

      {loading && <div className="loading">로딩 중...</div>}
      {error && <div className="error">{error}</div>}
      {!hasPosts && !loading && (
        <div className="empty-state">
          <p>아직 작성된 글이 없습니다.</p>
          {canWrite && (
            <button className="write-btn" onClick={() => setShowWriteModal(true)}>
              첫 글 작성하기
            </button>
          )}
        </div>
      )}
      {hasPosts && (
        <div className="board-content">
          <div className="posts-list">
            {posts.map((post) => (
              <div
                key={post.post_id}
                className={clsx('post-card', { active: selectedPostId === post.post_id })}
                onClick={() => fetchPostDetail(post.post_id)}
              >
                <div className="post-header">
                  <h3>{post.title}</h3>
                  <div className="post-meta">
                    <span className="author">{post.nickname}</span>
                    <span className="date">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR') : ''}
                    </span>
                  </div>
                </div>
                <p className="post-content">
                  {post.content.substring(0, 100)}
                  {post.content.length > 100 ? '...' : ''}
                </p>
                <div className="post-footer">
                  <span className="likes">❤️ {post.like_count || 0}</span>
                  <span className="views">👁️ {post.view_count || 0}</span>
                  <span className="comments">💬 {post.comment_count || 0}</span>
                </div>
              </div>
            ))}
          </div>

          {postDetail && (
            <div className="post-detail">
              <div className="detail-header">
                <h2>{postDetail.title}</h2>
                <div className="detail-meta">
                  <span className="author">{postDetail.nickname}</span>
                  <span className="date">
                    {postDetail.created_at ? new Date(postDetail.created_at).toLocaleDateString('ko-KR') : ''}
                  </span>
                </div>
              </div>
              <div className="detail-content">
                <p>{postDetail.content}</p>
                {postDetail.image_url && (
                  <img src={postDetail.image_url} alt="게시글 이미지" className="detail-image" />
                )}
              </div>
              <div className="detail-actions">
                <button
                  className={clsx('action-btn', { liked: postDetail.liked })}
                  onClick={() => toggleLike(postDetail.post_id)}
                >
                  <span>❤️</span>
                  <span>좋아요 ({postDetail.like_count || 0})</span>
                </button>
              </div>
              <div className="comments-section">
                <h3>댓글 ({comments.length})</h3>
                {comments.length === 0 ? (
                  <div className="no-comments">첫 댓글을 남겨보세요.</div>
                ) : (
                  <div className="comments-list">
                    {comments.map((comment) => (
                      <div key={comment.comment_id} className="comment-item">
                        <span className="comment-author">{comment.nickname || '익명'}</span>
                        <span className="comment-content">{comment.content}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="comment-input">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    type="text"
                    placeholder="댓글을 입력하세요"
                    onKeyUp={(e) => {
                      if (e.key === 'Enter') {
                        submitComment()
                      }
                    }}
                  />
                  <button onClick={submitComment} disabled={commentSubmitting}>
                    작성
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 글쓰기 모달 */}
      {showWriteModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowWriteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>새 글 작성</h2>
            <form onSubmit={submitPost}>
              <div className="form-group">
                <label>제목</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  type="text"
                  required
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>내용</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                  placeholder="내용을 입력하세요"
                  rows={10}
                />
              </div>
              <div className="form-group">
                <label>이미지 URL (선택)</label>
                <input
                  value={formImageUrl || ''}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  type="url"
                  placeholder="https://..."
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowWriteModal(false)}>
                  취소
                </button>
                <button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? '작성 중...' : '작성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 커플 등록 모달 */}
      {showCoupleModal && (
        <CoupleInviteModal
          show={showCoupleModal}
          coupleKey={coupleKey}
          gender={userGender}
          onClose={() => setShowCoupleModal(false)}
          onConnected={handleCoupleConnected}
        />
      )}
    </div>
  )
}
