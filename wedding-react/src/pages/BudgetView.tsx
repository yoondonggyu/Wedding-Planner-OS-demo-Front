import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import { API_BASE_URL } from '@/config/env'
import './BudgetView.css'

interface BudgetItem {
  id: number
  item_name: string
  category: string
  estimated_budget: number
  actual_expense: number
  quantity?: number | null
  unit?: string | null
  payer?: string | null
  notes?: string | null
}

interface BudgetSummary {
  total_budget: number
  total_estimated: number
  total_actual: number
  remaining: number
}

export default function BudgetView() {
  const authStore = useAuthStore()
  const { request } = useApi()

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary>({
    total_budget: 0,
    total_estimated: 0,
    total_actual: 0,
    remaining: 0,
  })

  const [showItemModal, setShowItemModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showOCRModal, setShowOCRModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  const [totalBudgetInput, setTotalBudgetInput] = useState('')
  const [itemForm, setItemForm] = useState({
    item_name: '',
    category: 'hall',
    estimated_budget: 0,
    actual_expense: 0,
    quantity: 1,
    unit: '',
    payer: 'both',
    notes: '',
  })

  const [ocrResult, setOcrResult] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const ocrInputRef = useRef<HTMLInputElement>(null)
  const importInputId = `budget-import-input-${Math.random().toString(36).slice(2)}`
  const ocrInputId = `budget-ocr-input-${Math.random().toString(36).slice(2)}`

  const canAccess = useMemo(() => true, [])

  useEffect(() => {
    if (authStore.isAuthenticated) {
      loadData()
    }
  }, [authStore.isAuthenticated])

  async function loadData() {
    await Promise.all([loadBudgetItems(), loadBudgetSummary()])
  }

  async function loadBudgetItems() {
    if (!authStore.user?.id) return
    try {
      const res = await request<{ message: string; data: { items: BudgetItem[] } }>(
        `/budget/items?user_id=${authStore.user.id}`,
        { method: 'GET' }
      )
      if (res.message === 'budget_items_retrieved') {
        setBudgetItems(res.data.items)
      }
    } catch (err) {
      console.error('예산 항목 로드 실패:', err)
    }
  }

  async function loadBudgetSummary() {
    if (!authStore.user?.id) return
    try {
      const res = await request<{ message: string; data: BudgetSummary }>(
        `/budget/summary?user_id=${authStore.user.id}`,
        { method: 'GET' }
      )
      if (res.message === 'budget_summary_retrieved') {
        setBudgetSummary(res.data)
      }
    } catch (err) {
      console.error('예산 요약 로드 실패:', err)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
  }

  function getCategoryName(category: string) {
    const names: Record<string, string> = {
      hall: '웨딩홀',
      dress: '드레스',
      studio: '스튜디오',
      snap: '스냅',
      honeymoon: '혼수/신혼여행',
      etc: '기타',
    }
    return names[category] || category
  }

  function getPayerName(payer?: string | null) {
    const names: Record<string, string> = {
      both: '공동',
      groom: '신랑',
      bride: '신부',
    }
    return payer ? names[payer] || payer : '-'
  }

  async function setTotalBudget() {
    if (!authStore.user?.id) return
    const budget = parseFloat(totalBudgetInput)
    if (isNaN(budget) || budget < 0) {
      alert('올바른 예산을 입력해주세요.')
      return
    }

    try {
      await request(`/budget/total?user_id=${authStore.user.id}`, {
        method: 'POST',
        body: { total_budget: budget },
      })
      setTotalBudgetInput('')
      await loadBudgetSummary()
    } catch (err) {
      console.error(err)
      alert('총 예산 설정에 실패했습니다.')
    }
  }

  function openItemModal(item?: BudgetItem) {
    if (item) {
      setEditingItemId(item.id)
      setItemForm({
        item_name: item.item_name,
        category: item.category,
        estimated_budget: item.estimated_budget,
        actual_expense: item.actual_expense,
        quantity: item.quantity || 1,
        unit: item.unit || '',
        payer: item.payer || 'both',
        notes: item.notes || '',
      })
    } else {
      setEditingItemId(null)
      setItemForm({
        item_name: '',
        category: 'hall',
        estimated_budget: 0,
        actual_expense: 0,
        quantity: 1,
        unit: '',
        payer: 'both',
        notes: '',
      })
    }
    setShowItemModal(true)
  }

  function closeItemModal() {
    setShowItemModal(false)
    setEditingItemId(null)
  }

  async function createItem() {
    if (!authStore.user?.id) return
    if (!itemForm.item_name || itemForm.estimated_budget <= 0) {
      alert('항목명과 예상 예산을 입력해주세요.')
      return
    }

    try {
      if (editingItemId) {
        const res = await request<{ message: string; data: { id: number; item_name: string } }>(
          `/budget/items/${editingItemId}?user_id=${authStore.user.id}`,
          {
            method: 'PUT',
            body: {
              item_name: itemForm.item_name,
              category: itemForm.category,
              estimated_budget: itemForm.estimated_budget,
              actual_expense: itemForm.actual_expense || 0,
              quantity: itemForm.quantity || 1,
              unit: itemForm.unit || null,
              payer: itemForm.payer,
              notes: itemForm.notes || null,
            },
          }
        )

        if (res.message === 'budget_item_updated') {
          alert('항목이 수정되었습니다.')
          closeItemModal()
          await loadData()
        } else {
          alert('항목 수정에 실패했습니다.')
        }
      } else {
        const res = await request<{ message: string; data: { id: number; item_name: string } }>(
          `/budget/items?user_id=${authStore.user.id}`,
          {
            method: 'POST',
            body: {
              item_name: itemForm.item_name,
              category: itemForm.category,
              estimated_budget: itemForm.estimated_budget,
              actual_expense: itemForm.actual_expense || 0,
              quantity: itemForm.quantity || 1,
              unit: itemForm.unit || null,
              payer: itemForm.payer,
              notes: itemForm.notes || null,
            },
          }
        )

        if (res.message === 'budget_item_created') {
          alert('항목이 추가되었습니다.')
          closeItemModal()
          await loadData()
        } else {
          alert('항목 추가에 실패했습니다.')
        }
      }
    } catch (err: any) {
      console.error('예산 항목 처리 오류:', err)
      const errorMessage = err?.data?.error || err?.message || '알 수 없는 오류가 발생했습니다.'
      alert(editingItemId ? `항목 수정에 실패했습니다: ${errorMessage}` : `항목 추가에 실패했습니다: ${errorMessage}`)
    }
  }

  async function deleteItem(itemId: number) {
    if (!authStore.user?.id) return
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await request(`/budget/items/${itemId}?user_id=${authStore.user.id}`, {
        method: 'DELETE',
      })
      await loadData()
    } catch (err) {
      console.error(err)
      alert('항목 삭제에 실패했습니다.')
    }
  }

  function exportExcel() {
    if (!authStore.user?.id) return
    window.open(
      `${API_BASE_URL}/budget/export/excel?user_id=${authStore.user.id}`,
      '_blank'
    )
  }

  function exportCSV() {
    if (!authStore.user?.id) return
    window.open(
      `${API_BASE_URL}/budget/export/csv?user_id=${authStore.user.id}`,
      '_blank'
    )
  }

  function openImportModal() {
    setShowImportModal(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }, 100)
  }

  function closeImportModal() {
    setShowImportModal(false)
    setIsDragging(false)
  }

  function triggerFileInput() {
    fileInputRef.current?.click()
  }

  function triggerOCRInput() {
    ocrInputRef.current?.click()
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
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

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        processFileUpload(file)
      } else {
        alert('Excel(.xlsx) 또는 CSV(.csv) 파일만 업로드 가능합니다.')
      }
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    processFileUpload(file)
  }

  async function processFileUpload(file: File) {
    if (!authStore.user?.id) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      alert('Excel(.xlsx) 또는 CSV(.csv) 파일만 업로드 가능합니다.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const fileType = file.name.endsWith('.xlsx') ? 'excel' : 'csv'
      const endpoint = fileType === 'excel' ? 'import/excel' : 'import/csv'

      const res = await request<{ message: string; data: { items_imported: number } }>(
        `/budget/${endpoint}?user_id=${authStore.user.id}`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (res.message === 'budget_imported') {
        alert(`${res.data.items_imported}개의 항목이 추가되었습니다.`)
        closeImportModal()
        await loadData()
      }
    } catch (err) {
      console.error(err)
      alert('파일 업로드에 실패했습니다.')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function openOCRModal() {
    setShowOCRModal(true)
    setOcrResult(null)
  }

  function closeOCRModal() {
    setShowOCRModal(false)
    setOcrResult(null)
  }

  async function handleOCRUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!authStore.user?.id) return
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setOcrResult('OCR 처리 중...')

    try {
      const res = await request<{
        message: string
        data: {
          items_created: number
          items: Array<{ item_name: string; estimated_budget: number }>
        }
      }>(`/budget/process-receipt?user_id=${authStore.user.id}`, {
        method: 'POST',
        body: formData,
      })

      if (res.message === 'receipt_processed') {
        setOcrResult(
          `처리 완료! ${res.data.items_created}개의 항목이 추가되었습니다.\n\n${res.data.items
            .map((item) => `${item.item_name} - ${formatCurrency(item.estimated_budget)}`)
            .join('\n')}`
        )
        await loadData()
      }
    } catch (err) {
      console.error(err)
      setOcrResult('OCR 처리에 실패했습니다.')
    }
  }

  return (
    <section className="section" id="budget">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="page-title">
          <h1>💰 Excel 형식의 예산서</h1>
          <p>OCR + LLM 구조화 + Excel/CSV Export</p>
        </div>

        {/* 예산 요약 */}
        <div className="card">
          <div className="budget-summary">
            <div className="summary-item">
              <div className="label">총 예산</div>
              <div className="value">{formatCurrency(budgetSummary.total_budget)}</div>
            </div>
            <div className="summary-item">
              <div className="label">예상 지출</div>
              <div className="value">{formatCurrency(budgetSummary.total_estimated)}</div>
            </div>
            <div className="summary-item">
              <div className="label">실제 지출</div>
              <div className="value">{formatCurrency(budgetSummary.total_actual)}</div>
            </div>
            <div className="summary-item">
              <div className="label">잔액</div>
              <div className="value">{formatCurrency(budgetSummary.remaining)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              value={totalBudgetInput}
              onChange={(e) => setTotalBudgetInput(e.target.value)}
              type="number"
              placeholder="총 예산 입력"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--soft)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text)',
              }}
            />
            <button className="btn primary" type="button" onClick={setTotalBudget}>
              총 예산 설정
            </button>
            <button className="btn" type="button" onClick={exportExcel}>
              Excel 다운로드
            </button>
            <button className="btn" type="button" onClick={exportCSV}>
              CSV 다운로드
            </button>
            <button className="btn" type="button" onClick={openImportModal}>
              파일 업로드
            </button>
            <button className="btn" type="button" onClick={openOCRModal}>
              영수증 OCR
            </button>
            <button className="btn primary" type="button" onClick={() => openItemModal()}>
              항목 추가
            </button>
          </div>
        </div>

        {/* 예산 테이블 */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>예산 항목</h2>
          <div className="table-container">
            <table id="budgetTable">
              <thead>
                <tr>
                  <th>항목명</th>
                  <th>카테고리</th>
                  <th>예상 예산</th>
                  <th>실제 지출</th>
                  <th>수량</th>
                  <th>단위</th>
                  <th>담당자</th>
                  <th>비고</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                      예산 항목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  budgetItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.item_name}</td>
                      <td>{getCategoryName(item.category)}</td>
                      <td>{formatCurrency(item.estimated_budget)}</td>
                      <td>{formatCurrency(item.actual_expense)}</td>
                      <td>{item.quantity || '-'}</td>
                      <td>{item.unit || '-'}</td>
                      <td>{getPayerName(item.payer)}</td>
                      <td>{item.notes || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn"
                            type="button"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => openItemModal(item)}
                          >
                            수정
                          </button>
                          <button
                            className="btn danger"
                            type="button"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => deleteItem(item.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 항목 추가 모달 */}
      {showItemModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeItemModal()}>
          <div className="modal-card">
            <h3 style={{ marginTop: 0 }}>{editingItemId ? '예산 항목 수정' : '예산 항목 추가'}</h3>
            <div className="form-group">
              <label>항목명</label>
              <input
                value={itemForm.item_name}
                onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })}
                type="text"
                required
              />
            </div>
            <div className="form-group">
              <label>카테고리</label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              >
                <option value="hall">웨딩홀</option>
                <option value="dress">드레스</option>
                <option value="studio">스튜디오</option>
                <option value="snap">스냅</option>
                <option value="honeymoon">혼수/신혼여행</option>
                <option value="etc">기타</option>
              </select>
            </div>
            <div className="form-group">
              <label>예상 예산</label>
              <input
                value={itemForm.estimated_budget}
                onChange={(e) => setItemForm({ ...itemForm, estimated_budget: parseFloat(e.target.value) || 0 })}
                type="number"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>실제 지출</label>
              <input
                value={itemForm.actual_expense}
                onChange={(e) => setItemForm({ ...itemForm, actual_expense: parseFloat(e.target.value) || 0 })}
                type="number"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>수량</label>
              <input
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 1 })}
                type="number"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>단위</label>
              <input
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                type="text"
                placeholder="인원, 시간 등"
              />
            </div>
            <div className="form-group">
              <label>담당자</label>
              <select value={itemForm.payer} onChange={(e) => setItemForm({ ...itemForm, payer: e.target.value })}>
                <option value="both">공동</option>
                <option value="groom">신랑</option>
                <option value="bride">신부</option>
              </select>
            </div>
            <div className="form-group">
              <label>비고</label>
              <textarea
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn" type="button" onClick={closeItemModal}>
                취소
              </button>
              <button className="btn primary" type="button" onClick={createItem}>
                {editingItemId ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 파일 업로드 모달 */}
      {showImportModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeImportModal()}>
          <div className="modal-card">
            <h3 style={{ marginTop: 0 }}>파일 업로드</h3>
            <div
              className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id={importInputId}
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={handleFileUpload}
                className="file-input-overlay"
              />
              {!isDragging ? (
                <p className="upload-hint">
                  Excel 또는 CSV 파일을 업로드하세요<br />
                  <small>드래그하거나 클릭하여 파일 선택</small>
                </p>
              ) : (
                <p className="upload-hint" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  📤 파일을 놓아주세요
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn" type="button" onClick={closeImportModal}>
                취소
              </button>
              <button className="btn primary" type="button" onClick={triggerFileInput}>
                파일 선택
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR 모달 */}
      {showOCRModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeOCRModal()}>
          <div className="modal-card">
            <h3 style={{ marginTop: 0 }}>영수증/견적서 OCR</h3>
            <div className={`file-upload-area ${isDragging ? 'dragging' : ''}`}>
              <p>이미지 파일을 드래그하거나 클릭하여 업로드</p>
              <input
                ref={ocrInputRef}
                id={ocrInputId}
                type="file"
                accept="image/*"
                onChange={handleOCRUpload}
                className="file-input-overlay"
              />
            </div>
            {ocrResult && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'var(--soft)',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text)',
                }}
              >
                {ocrResult}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn" type="button" onClick={closeOCRModal}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
