import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import clsx from 'clsx'
import './DocumentVaultView.css'

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

export default function DocumentVaultView() {
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

  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [ocrText, setOcrText] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    tags?: string[]
    summary?: string
    sentiment?: { label: string; confidence: number }
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const vaultUploadInputId = `vault-upload-input-${Math.random().toString(36).slice(2)}`

  const canWrite = useMemo(() => true, [])
  const hasPosts = useMemo(() => posts.length > 0, [posts])

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [authStore.isAuthenticated])

  async function fetchPosts() {
    setLoading(true)
    setError(null)
    try {
      const res = await request<{
        message: string
        data: { posts: PostSummary[] }
      }>(`/posts?board_type=vault`, {
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

  async function fetchPostDetail(postId: number) {
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

  async function toggleLike(postId: number) {
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

  async function submitComment() {
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

  function clearFile() {
    setSelectedFile(null)
    setFormImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (!ocrProcessing) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    if (ocrProcessing) return

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      processFile(file)
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(file)
  }

  async function processFile(file: File) {
    setSelectedFile(file)

    if (isImageFile(file)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormImageUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFormImageUrl(null)
    }

    if (!formTitle.trim()) {
      setFormTitle(getFileNameWithoutExtension(file.name) || file.name)
    }

    setOcrText(null)
    setOcrError(null)
  }

  async function analyzeFile() {
    if (!selectedFile) {
      alert('파일을 먼저 선택해주세요.')
      return
    }

    const file = selectedFile

    if (!isSupportedOcrFile(file)) {
      setOcrError('지원하지 않는 파일 형식입니다. 이미지, PDF, Excel, CSV, 텍스트 파일만 분석이 가능합니다.')
      return
    }

    setOcrProcessing(true)
    setOcrText(null)
    setOcrError(null)
    setAiAnalysisResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', formTitle.trim() || file.name)

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
        setOcrText(res.data.ocr_text)
        setFormContent(res.data.ocr_text)

        if (res.data.summary) {
          setAiAnalysisResult({
            summary: res.data.summary,
            tags: res.data.tags || [],
          })
        }
      } else if (res.data?.ocr_error) {
        setOcrError(res.data.ocr_error)
        setFormContent('파일 분석에 실패했습니다. 수동으로 내용을 입력해주세요.')
      }
    } catch (err: any) {
      console.error('파일 분석 실패:', err)
      setOcrError(err?.data?.error || err?.message || '파일 분석에 실패했습니다.')
      setFormContent('파일 분석에 실패했습니다. 수동으로 내용을 입력해주세요.')
    } finally {
      setOcrProcessing(false)
    }
  }

  async function submitPost(e?: React.FormEvent) {
    if (e) {
      e.preventDefault()
    }

    if (ocrProcessing) {
      alert('OCR 처리 중입니다. 잠시만 기다려주세요.')
      return
    }

    if (!formTitle.trim() || formSubmitting) {
      alert('제목을 입력해주세요.')
      return
    }

    if (!formContent.trim() && !selectedFile) {
      alert('내용을 입력하거나 파일을 첨부해주세요.')
      return
    }

    setFormSubmitting(true)
    try {
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', formTitle.trim())
        formData.append('content', formContent.trim() || '')
        formData.append('board_type', 'vault')

        const res = await request<{
          message: string
          data: { post_id: number }
        }>('/posts/upload-document', {
          method: 'POST',
          body: formData,
        })

        setShowWriteModal(false)
        setFormTitle('')
        setFormContent('')
        setFormImageUrl(null)
        setSelectedFile(null)
        setOcrText(null)
        setOcrError(null)
        setAiAnalysisResult(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        await fetchPosts()
        if (res.data?.post_id) {
          await fetchPostDetail(res.data.post_id)
        }
      } else {
        const res = await request<{
          message: string
          data: { post_id: number }
        }>('/posts', {
          method: 'POST',
          body: {
            title: formTitle.trim(),
            content: formContent.trim(),
            image_url: formImageUrl || null,
            board_type: 'vault',
          },
        })

        setShowWriteModal(false)
        setFormTitle('')
        setFormContent('')
        setFormImageUrl(null)
        setSelectedFile(null)
        setOcrText(null)
        setOcrError(null)
        setAiAnalysisResult(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
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
      setFormSubmitting(false)
    }
  }

  function closeWriteModal() {
    setShowWriteModal(false)
    setFormTitle('')
    setFormContent('')
    setFormImageUrl(null)
    setSelectedFile(null)
    setOcrText(null)
    setOcrError(null)
    setAiAnalysisResult(null)
    setIsDragging(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="board-view">
      <div className="board-header">
        <div className="header-content">
          <h1>📁 문서 보관함</h1>
          <p className="header-description">결혼 준비 중 필요한 문서들을 모아두는 공간입니다.</p>
        </div>
        {canWrite && (
          <button className="write-btn" onClick={() => setShowWriteModal(true)}>
            <span className="icon">✏️</span>
            <span>문서 추가</span>
          </button>
        )}
      </div>

      {loading && <div className="loading">로딩 중...</div>}
      {error && <div className="error">{error}</div>}
      {!hasPosts && !loading && (
        <div className="empty-state">
          <p>아직 저장된 문서가 없습니다.</p>
          {canWrite && (
            <button className="write-btn" onClick={() => setShowWriteModal(true)}>
              첫 문서 추가하기
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
                  <div className="attachment-viewer">
                    {isImageAttachment(postDetail.image_url) ? (
                      <img src={postDetail.image_url} alt="문서 이미지" className="detail-image" />
                    ) : (
                      <a className="attachment-link" href={postDetail.image_url} target="_blank" rel="noopener">
                        📎 원본 파일 열기
                      </a>
                    )}
                  </div>
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

      {/* 문서 추가 모달 */}
      {showWriteModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeWriteModal()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📄 문서 추가</h2>
            <form onSubmit={submitPost}>
              <div className="form-group">
                <label>
                  문서 제목 <span className="required">*</span>
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  type="text"
                  required
                  placeholder="예: 웨딩홀 견적서, 스드메 계약서 등"
                  disabled={ocrProcessing}
                />
              </div>

              <div className="form-group">
                <label>문서 파일 첨부 (선택사항)</label>
                <div
                  className={clsx('file-upload-area', {
                    'has-file': selectedFile,
                    dragging: isDragging,
                  })}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    id={vaultUploadInputId}
                    type="file"
                    accept="*/*"
                    onChange={handleFileSelect}
                    disabled={ocrProcessing}
                    className="file-input-overlay"
                  />
                  <div className="file-upload-info">
                    {!selectedFile && !isDragging ? (
                      <p className="file-hint">
                        📎 문서 파일을 첨부할 수 있습니다.<br />
                        <label htmlFor={vaultUploadInputId} className="file-select-link">
                          파일 선택하기
                        </label>
                        <small>모든 파일 형식 지원 (최대 10MB)</small>
                        <br />
                        <strong style={{ color: 'var(--accent, #667eea)', marginTop: '8px', display: 'block' }}>
                          클릭하거나 파일을 드래그하여 첨부
                        </strong>
                      </p>
                    ) : isDragging ? (
                      <p className="file-hint" style={{ color: 'var(--accent, #667eea)', fontWeight: 600 }}>
                        📤 파일을 놓아주세요
                      </p>
                    ) : (
                      <div className="file-selected">
                        <span>✅ {selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearFile()
                          }}
                          className="remove-file-btn"
                          disabled={ocrProcessing}
                        >
                          제거
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedFile && isSupportedOcrFile(selectedFile) && !ocrText && (
                  <div className="ocr-action">
                    <button type="button" onClick={analyzeFile} disabled={ocrProcessing} className="ocr-btn">
                      {ocrProcessing ? '분석 중...' : '🔍 파일 분석하기 (OCR + VLLM)'}
                    </button>
                    <small className="ocr-hint">
                      OCR로 텍스트를 추출하고 VLLM으로 문서를 분석하여 요약 및 태그를 생성합니다.
                    </small>
                  </div>
                )}

                {ocrProcessing && (
                  <div className="ocr-status">
                    <div className="ocr-loading">
                      <span className="spinner">⏳</span>
                      <span>파일 분석 중... OCR로 텍스트를 추출하고 VLLM으로 분석하고 있습니다.</span>
                    </div>
                  </div>
                )}

                {ocrError && (
                  <div className="ocr-error">
                    <span>⚠️ {ocrError}</span>
                  </div>
                )}

                {ocrText && !ocrProcessing && (
                  <div className="ocr-success">
                    <span>✅ 분석 완료: {ocrText.length}자 추출됨</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  문서 내용 {!selectedFile && <span className="required">*</span>}
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required={!selectedFile}
                  placeholder="OCR 결과가 자동으로 입력되거나 수동으로 입력할 수 있습니다."
                  rows={12}
                  disabled={ocrProcessing}
                />
                <small className="form-hint">
                  💡 OCR로 추출된 텍스트가 자동으로 입력됩니다. 필요시 수정할 수 있습니다. 파일만 첨부하고 내용을 입력하지
                  않아도 됩니다.
                </small>
              </div>

              {aiAnalysisResult?.summary && (
                <div className="ai-summary">
                  <label>🤖 VLLM 분석 결과</label>
                  <div className="summary-box">
                    <div className="summary-content">{aiAnalysisResult.summary}</div>
                    {aiAnalysisResult.tags && aiAnalysisResult.tags.length > 0 && (
                      <div className="summary-tags">
                        <span className="tags-label">태그:</span>
                        {aiAnalysisResult.tags.map((tag) => (
                          <span key={tag} className="tag-badge">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={closeWriteModal} disabled={ocrProcessing}>
                  취소
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || ocrProcessing || !formTitle.trim() || (!formContent.trim() && !selectedFile)}
                >
                  {ocrProcessing ? 'OCR 처리 중...' : formSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
