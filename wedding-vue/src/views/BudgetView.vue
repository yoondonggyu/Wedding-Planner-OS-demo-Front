<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

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

const authStore = useAuthStore()
const { request } = useApi()

const budgetItems = ref<BudgetItem[]>([])
const budgetSummary = ref<BudgetSummary>({
  total_budget: 0,
  total_estimated: 0,
  total_actual: 0,
  remaining: 0,
})

const showItemModal = ref(false)
const showImportModal = ref(false)
const showOCRModal = ref(false)
const editingItemId = ref<number | null>(null)

const totalBudgetInput = ref('')
const itemForm = ref({
  item_name: '',
  category: 'hall',
  estimated_budget: 0,
  actual_expense: 0,
  quantity: 1,
  unit: '',
  payer: 'both',
  notes: '',
})

const ocrResult = ref<string | null>(null)

// 로그인 체크 제거 - 로그인 없이도 접근 가능
const canAccess = computed(() => true)

onMounted(() => {
  // 로그인 체크 제거됨 - 로그인 없이도 접근 가능
  // 로그인 상태일 때만 데이터 로드
  if (authStore.isAuthenticated) {
    loadData()
  }
})

async function loadData() {
  await Promise.all([loadBudgetItems(), loadBudgetSummary()])
}

async function loadBudgetItems() {
  try {
    const res = await request<{ message: string; data: { items: BudgetItem[] } }>(
      `/budget/items?user_id=${authStore.user!.id}`,
      { method: 'GET' }
    )
    if (res.message === 'budget_items_retrieved') {
      budgetItems.value = res.data.items
    }
  } catch (err) {
    console.error('예산 항목 로드 실패:', err)
  }
}

async function loadBudgetSummary() {
  try {
    const res = await request<{ message: string; data: BudgetSummary }>(
      `/budget/summary?user_id=${authStore.user!.id}`,
      { method: 'GET' }
    )
    if (res.message === 'budget_summary_retrieved') {
      budgetSummary.value = res.data
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
  const budget = parseFloat(totalBudgetInput.value)
  if (isNaN(budget) || budget < 0) {
    alert('올바른 예산을 입력해주세요.')
    return
  }

  try {
    await request(`/budget/total?user_id=${authStore.user!.id}`, {
      method: 'POST',
      body: { total_budget: budget },
    })
    totalBudgetInput.value = ''
    await loadBudgetSummary()
  } catch (err) {
    console.error(err)
    alert('총 예산 설정에 실패했습니다.')
  }
}

function openItemModal(item?: BudgetItem) {
  if (item) {
    editingItemId.value = item.id
    itemForm.value = {
      item_name: item.item_name,
      category: item.category,
      estimated_budget: item.estimated_budget,
      actual_expense: item.actual_expense,
      quantity: item.quantity || 1,
      unit: item.unit || '',
      payer: item.payer || 'both',
      notes: item.notes || '',
    }
  } else {
    editingItemId.value = null
    itemForm.value = {
      item_name: '',
      category: 'hall',
      estimated_budget: 0,
      actual_expense: 0,
      quantity: 1,
      unit: '',
      payer: 'both',
      notes: '',
    }
  }
  showItemModal.value = true
}

function closeItemModal() {
  showItemModal.value = false
  editingItemId.value = null
}

async function createItem() {
  if (!itemForm.value.item_name || itemForm.value.estimated_budget <= 0) {
    alert('항목명과 예상 예산을 입력해주세요.')
    return
  }

  try {
    if (editingItemId.value) {
      // 수정
      const res = await request<{ message: string; data: { id: number; item_name: string } }>(
        `/budget/items/${editingItemId.value}?user_id=${authStore.user!.id}`,
        {
          method: 'PUT',
          body: {
            item_name: itemForm.value.item_name,
            category: itemForm.value.category,
            estimated_budget: itemForm.value.estimated_budget,
            actual_expense: itemForm.value.actual_expense || 0,
            quantity: itemForm.value.quantity || 1,
            unit: itemForm.value.unit || null,
            payer: itemForm.value.payer,
            notes: itemForm.value.notes || null,
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
      // 생성
      const res = await request<{ message: string; data: { id: number; item_name: string } }>(
        `/budget/items?user_id=${authStore.user!.id}`,
        {
          method: 'POST',
          body: {
            item_name: itemForm.value.item_name,
            category: itemForm.value.category,
            estimated_budget: itemForm.value.estimated_budget,
            actual_expense: itemForm.value.actual_expense || 0,
            quantity: itemForm.value.quantity || 1,
            unit: itemForm.value.unit || null,
            payer: itemForm.value.payer,
            notes: itemForm.value.notes || null,
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
    alert(editingItemId.value ? `항목 수정에 실패했습니다: ${errorMessage}` : `항목 추가에 실패했습니다: ${errorMessage}`)
  }
}

async function deleteItem(itemId: number) {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await request(`/budget/items/${itemId}?user_id=${authStore.user!.id}`, {
      method: 'DELETE',
    })
    await loadData()
  } catch (err) {
    console.error(err)
    alert('항목 삭제에 실패했습니다.')
  }
}

function exportExcel() {
  window.open(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8101/api'}/budget/export/excel?user_id=${authStore.user!.id}`,
    '_blank'
  )
}

function exportCSV() {
  window.open(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8101/api'}/budget/export/csv?user_id=${authStore.user!.id}`,
    '_blank'
  )
}

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importInputId = `budget-import-input-${Math.random().toString(36).slice(2)}`
const ocrInputRef = ref<HTMLInputElement | null>(null)
const ocrInputId = `budget-ocr-input-${Math.random().toString(36).slice(2)}`

function openImportModal() {
  showImportModal.value = true
  // 모달이 열릴 때 파일 입력 초기화
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  // 모달이 열리면 자동으로 파일 선택 다이얼로그 열기
  setTimeout(() => {
    if (fileInputRef.value) {
      fileInputRef.value.click()
    }
  }, 100)
}

function closeImportModal() {
  showImportModal.value = false
  isDragging.value = false
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function triggerOCRInput() {
  ocrInputRef.value?.click()
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
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

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  processFileUpload(file)
}

async function processFileUpload(file: File) {
  // 파일 타입 검증
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
      `/budget/${endpoint}?user_id=${authStore.user!.id}`,
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
    // 파일 입력 초기화
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

function openOCRModal() {
  showOCRModal.value = true
  ocrResult.value = null
}

function closeOCRModal() {
  showOCRModal.value = false
  ocrResult.value = null
}

async function handleOCRUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  ocrResult.value = 'OCR 처리 중...'

  try {
    const res = await request<{
      message: string
      data: {
        items_created: number
        items: Array<{ item_name: string; estimated_budget: number }>
      }
    }>(`/budget/process-receipt?user_id=${authStore.user!.id}`, {
      method: 'POST',
      body: formData,
    })

    if (res.message === 'receipt_processed') {
      ocrResult.value = `처리 완료! ${res.data.items_created}개의 항목이 추가되었습니다.\n\n${res.data.items
        .map((item) => `${item.item_name} - ${formatCurrency(item.estimated_budget)}`)
        .join('\n')}`
      await loadData()
    }
  } catch (err) {
    console.error(err)
    ocrResult.value = 'OCR 처리에 실패했습니다.'
  }
}
</script>

<template>
  <section class="section" id="budget">
    <div class="container" style="display: flex; flex-direction: column; gap: 20px">
      <div class="page-title">
        <h1>💰 Excel 형식의 예산서</h1>
        <p>OCR + LLM 구조화 + Excel/CSV Export</p>
      </div>

      <!-- 예산 요약 -->
      <div class="card">
        <div class="budget-summary">
          <div class="summary-item">
            <div class="label">총 예산</div>
            <div class="value">{{ formatCurrency(budgetSummary.total_budget) }}</div>
          </div>
          <div class="summary-item">
            <div class="label">예상 지출</div>
            <div class="value">{{ formatCurrency(budgetSummary.total_estimated) }}</div>
          </div>
          <div class="summary-item">
            <div class="label">실제 지출</div>
            <div class="value">{{ formatCurrency(budgetSummary.total_actual) }}</div>
          </div>
          <div class="summary-item">
            <div class="label">잔액</div>
            <div class="value">{{ formatCurrency(budgetSummary.remaining) }}</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          <input
            v-model="totalBudgetInput"
            type="number"
            placeholder="총 예산 입력"
            style="flex: 1; min-width: 200px; padding: 10px; border-radius: 8px; background: var(--soft); border: 1px solid rgba(255,255,255,0.1); color: var(--text)"
          />
          <button class="btn primary" type="button" @click="setTotalBudget">총 예산 설정</button>
          <button class="btn" type="button" @click="exportExcel">Excel 다운로드</button>
          <button class="btn" type="button" @click="exportCSV">CSV 다운로드</button>
          <button class="btn" type="button" @click="openImportModal">파일 업로드</button>
          <button class="btn" type="button" @click="openOCRModal">영수증 OCR</button>
          <button class="btn primary" type="button" @click="openItemModal">항목 추가</button>
        </div>
      </div>

      <!-- 예산 테이블 -->
      <div class="card">
        <h2 style="margin-top: 0">예산 항목</h2>
        <div class="table-container">
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
              <tr v-if="budgetItems.length === 0">
                <td colspan="9" style="text-align: center; padding: 40px; color: var(--muted)">
                  예산 항목이 없습니다.
                </td>
              </tr>
              <tr v-for="item in budgetItems" :key="item.id">
                <td>{{ item.item_name }}</td>
                <td>{{ getCategoryName(item.category) }}</td>
                <td>{{ formatCurrency(item.estimated_budget) }}</td>
                <td>{{ formatCurrency(item.actual_expense) }}</td>
                <td>{{ item.quantity || '-' }}</td>
                <td>{{ item.unit || '-' }}</td>
                <td>{{ getPayerName(item.payer) }}</td>
                <td>{{ item.notes || '-' }}</td>
                <td>
                  <div style="display: flex; gap: 4px">
                    <button
                      class="btn"
                      type="button"
                      style="padding: 4px 8px; font-size: 12px"
                      @click="openItemModal(item)"
                    >
                      수정
                    </button>
                    <button
                      class="btn danger"
                      type="button"
                      style="padding: 4px 8px; font-size: 12px"
                      @click="deleteItem(item.id)"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 항목 추가 모달 -->
    <div v-if="showItemModal" class="modal-overlay" @click.self="closeItemModal">
      <div class="modal-card">
        <h3 style="margin-top: 0">{{ editingItemId ? '예산 항목 수정' : '예산 항목 추가' }}</h3>
        <div class="form-group">
          <label>항목명</label>
          <input v-model="itemForm.item_name" type="text" required />
        </div>
        <div class="form-group">
          <label>카테고리</label>
          <select v-model="itemForm.category">
            <option value="hall">웨딩홀</option>
            <option value="dress">드레스</option>
            <option value="studio">스튜디오</option>
            <option value="snap">스냅</option>
            <option value="honeymoon">혼수/신혼여행</option>
            <option value="etc">기타</option>
          </select>
        </div>
        <div class="form-group">
          <label>예상 예산</label>
          <input v-model.number="itemForm.estimated_budget" type="number" step="0.01" required />
        </div>
        <div class="form-group">
          <label>실제 지출</label>
          <input v-model.number="itemForm.actual_expense" type="number" step="0.01" value="0" />
        </div>
        <div class="form-group">
          <label>수량</label>
          <input v-model.number="itemForm.quantity" type="number" step="0.01" value="1" />
        </div>
        <div class="form-group">
          <label>단위</label>
          <input v-model="itemForm.unit" type="text" placeholder="인원, 시간 등" />
        </div>
        <div class="form-group">
          <label>담당자</label>
          <select v-model="itemForm.payer">
            <option value="both">공동</option>
            <option value="groom">신랑</option>
            <option value="bride">신부</option>
          </select>
        </div>
        <div class="form-group">
          <label>비고</label>
          <textarea v-model="itemForm.notes"></textarea>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px">
          <button class="btn" type="button" @click="closeItemModal">취소</button>
          <button class="btn primary" type="button" @click="createItem">
            {{ editingItemId ? '수정' : '추가' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 파일 업로드 모달 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal-card">
        <h3 style="margin-top: 0">파일 업로드</h3>
        <div
          class="file-upload-area"
          :class="{ 'dragging': isDragging }"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInputRef"
            :id="importInputId"
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            @change="handleFileUpload"
            class="file-input-overlay"
          />
          <p v-if="!isDragging" class="upload-hint">
            Excel 또는 CSV 파일을 업로드하세요<br>
            <small>드래그하거나 클릭하여 파일 선택</small>
          </p>
          <p v-else class="upload-hint" style="color: var(--accent); font-weight: 600">
            📤 파일을 놓아주세요
          </p>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px">
          <button class="btn" type="button" @click="closeImportModal">취소</button>
          <button class="btn primary" type="button" @click="triggerFileInput">
            파일 선택
          </button>
        </div>
      </div>
    </div>

    <!-- OCR 모달 -->
    <div v-if="showOCRModal" class="modal-overlay" @click.self="closeOCRModal">
      <div class="modal-card">
        <h3 style="margin-top: 0">영수증/견적서 OCR</h3>
        <div
          class="file-upload-area"
          :class="{ 'dragging': isDragging }"
        >
          <p>이미지 파일을 드래그하거나 클릭하여 업로드</p>
          <input
            ref="ocrInputRef"
            :id="ocrInputId"
            type="file"
            accept="image/*"
            @change="handleOCRUpload"
            class="file-input-overlay"
          />
        </div>
        <div
          v-if="ocrResult"
          style="
            margin-top: 16px;
            padding: 12px;
            background: var(--soft);
            border-radius: 8px;
            white-space: pre-wrap;
            color: var(--text);
          "
        >
          {{ ocrResult }}
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px">
          <button class="btn" type="button" @click="closeOCRModal">취소</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.budget-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  background: var(--soft);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.summary-item .label {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}

.summary-item .value {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

th {
  background: var(--soft);
  font-weight: 600;
  font-size: 14px;
}

td {
  font-size: 14px;
}

.file-upload-area {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.file-upload-area:hover {
  border-color: var(--accent);
  background: rgba(139, 92, 246, 0.1);
}

.file-upload-area.dragging {
  border-color: var(--accent);
  background: rgba(139, 92, 246, 0.2);
  border-style: solid;
  transform: scale(1.02);
}

.file-input-overlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-hint {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
}

.upload-hint small {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.7;
}

.modal-card {
  background: var(--background-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 30px;
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  color: var(--text);
}

[data-theme='dark'] .modal-card {
  background: rgba(25, 25, 35, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

[data-theme='light'] .modal-card {
  background: var(--card);
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text);
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--input-background);
  color: var(--text);
  font-size: 1em;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.form-group input[type='text']:focus,
.form-group input[type='number']:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 139, 92, 246), 0.1);
}

[data-theme='dark'] .form-group input[type='text'],
[data-theme='dark'] .form-group input[type='number'],
[data-theme='dark'] .form-group select,
[data-theme='dark'] .form-group textarea {
  background: rgba(40, 40, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text);
}

[data-theme='dark'] .form-group input[type='text']:focus,
[data-theme='dark'] .form-group input[type='number']:focus,
[data-theme='dark'] .form-group select:focus,
[data-theme='dark'] .form-group textarea:focus {
  border-color: var(--accent);
  background: rgba(50, 50, 60, 0.9);
  box-shadow: 0 0 0 3px rgba(201, 154, 106, 0.2);
}

[data-theme='light'] .form-group input[type='text'],
[data-theme='light'] .form-group input[type='number'],
[data-theme='light'] .form-group select,
[data-theme='light'] .form-group textarea {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: var(--text);
}

[data-theme='light'] .form-group input[type='text']:focus,
[data-theme='light'] .form-group input[type='number']:focus,
[data-theme='light'] .form-group select:focus,
[data-theme='light'] .form-group textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(201, 154, 106, 0.15);
}

/* 드롭다운 스타일 개선 */
select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-6.5%200-12.3%203.2-16.1%208.1-3.8%204.9-4.9%2011-3.1%2017.4l130%20140c3.8%204.9%209.6%208.1%2016.1%208.1s12.3-3.2%2016.1-8.1l130-140c1.8-6.4.7-12.5-3.1-17.4z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 30px;
}

[data-theme='light'] select {
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%3E%3Cpath%20fill%3D%22%23888888%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-6.5%200-12.3%203.2-16.1%208.1-3.8%204.9-4.9%2011-3.1%2017.4l130%20140c3.8%204.9%209.6%208.1%2016.1%208.1s12.3-3.2%2016.1-8.1l130-140c1.8-6.4.7-12.5-3.1-17.4z%22%2F%3E%3C%2Fsvg%3E');
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s, box-shadow 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn.primary {
  background: var(--accent);
  color: white;
}

.btn.primary:hover {
  background: var(--accent-2);
}

[data-theme='dark'] .btn.primary {
  box-shadow: 0 2px 8px rgba(201, 154, 106, 0.3);
}

[data-theme='dark'] .btn.primary:hover {
  box-shadow: 0 4px 12px rgba(201, 154, 106, 0.4);
}

.btn:not(.primary) {
  background: var(--button-background);
  color: var(--button-text);
  border: 1px solid var(--button-border);
}

.btn:not(.primary):hover {
  background: var(--button-hover-background);
}

[data-theme='dark'] .btn:not(.primary) {
  background: rgba(50, 50, 60, 0.8);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme='dark'] .btn:not(.primary):hover {
  background: rgba(60, 60, 70, 0.9);
  border-color: var(--accent);
}

[data-theme='light'] .btn:not(.primary) {
  background: #ffffff;
  color: var(--text);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

[data-theme='light'] .btn:not(.primary):hover {
  background: var(--soft);
  border-color: var(--accent);
}

/* 모바일 스타일 */
@media (max-width: 768px) {
  .section {
    padding: 16px 8px;
  }

  .container {
    padding: 0 12px;
  }

  .page-title h1 {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .page-title p {
    font-size: 12px;
  }

  .card {
    padding: 16px;
    margin-bottom: 16px;
  }

  .budget-summary {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .summary-item {
    padding: 12px 8px;
  }

  .summary-item .label {
    font-size: 10px;
    margin-bottom: 4px;
  }

  .summary-item .value {
    font-size: 16px;
  }

  .card > div[style*="display: flex"] {
    flex-direction: column;
    gap: 8px;
  }

  .card > div[style*="display: flex"] > input,
  .card > div[style*="display: flex"] > button {
    width: 100%;
    font-size: 13px;
    padding: 10px;
  }

  .table-container {
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
  }

  table {
    font-size: 11px;
  }

  th, td {
    padding: 8px 6px;
    font-size: 11px;
  }

  th {
    font-size: 10px;
  }

  .modal-card {
    padding: 20px 16px;
    width: 95%;
    max-width: none;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 8px 10px;
    font-size: 14px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 13px;
  }

  .file-upload-area {
    padding: 24px 16px;
  }
}

@media (max-width: 480px) {
  .budget-summary {
    grid-template-columns: 1fr;
  }

  .summary-item .value {
    font-size: 18px;
  }

  table {
    font-size: 10px;
  }

  th, td {
    padding: 6px 4px;
    font-size: 10px;
  }
}
</style>
