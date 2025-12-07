<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <div class="modal-header">
        <h2>기본 정보 입력</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="modal-body">
        <p class="info-text" v-if="hasSavedInfo">
          저장된 정보가 있습니다. 수정하거나 그대로 사용할 수 있습니다.
        </p>
        
        <form @submit.prevent="handleSubmit">
          <!-- 신랑/신부 이름 -->
          <div class="form-section">
            <h3>신랑 & 신부</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="groom-name">신랑 이름 *</label>
                <input
                  id="groom-name"
                  v-model="formData.groom_name"
                  type="text"
                  placeholder="김철수"
                  required
                />
              </div>
              <div class="form-group">
                <label for="bride-name">신부 이름 *</label>
                <input
                  id="bride-name"
                  v-model="formData.bride_name"
                  type="text"
                  placeholder="이영희"
                  required
                />
              </div>
            </div>
          </div>

          <!-- 양가 부모님 성함 -->
          <div class="form-section">
            <h3>양가 부모님 성함</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="groom-father">신랑 부</label>
                <input
                  id="groom-father"
                  v-model="formData.groom_father_name"
                  type="text"
                  placeholder="김아버지"
                />
              </div>
              <div class="form-group">
                <label for="groom-mother">신랑 모</label>
                <input
                  id="groom-mother"
                  v-model="formData.groom_mother_name"
                  type="text"
                  placeholder="박어머니"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="bride-father">신부 부</label>
                <input
                  id="bride-father"
                  v-model="formData.bride_father_name"
                  type="text"
                  placeholder="이아버지"
                />
              </div>
              <div class="form-group">
                <label for="bride-mother">신부 모</label>
                <input
                  id="bride-mother"
                  v-model="formData.bride_mother_name"
                  type="text"
                  placeholder="최어머니"
                />
              </div>
            </div>
          </div>

          <!-- 예식 정보 -->
          <div class="form-section">
            <h3>예식 정보</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="wedding-date">예식일 *</label>
                <div class="date-input-wrapper">
                  <input
                    id="wedding-date"
                    :value="formData.wedding_date"
                    type="text"
                    placeholder="YYYY-MM-DD"
                    maxlength="10"
                    required
                    @keydown="handleDateKeydown"
                    @input="handleDateInput"
                    @paste="handleDatePaste"
                  />
                  <span class="input-icon">📅</span>
                </div>
              </div>
              <div class="form-group">
                <label>예식 시간 *</label>
                <div class="time-input-wrapper">
                  <input
                    v-model="timeHour"
                    type="text"
                    placeholder="시"
                    maxlength="2"
                    class="time-input"
                    @input="handleHourInput"
                  />
                  <span class="time-separator">:</span>
                  <input
                    v-model="timeMinute"
                    type="text"
                    placeholder="분"
                    maxlength="2"
                    class="time-input"
                    @input="handleMinuteInput"
                  />
                  <button
                    type="button"
                    class="period-btn"
                    :class="{ active: timePeriod === 'AM' }"
                    @click="timePeriod = 'AM'"
                  >
                    오전
                  </button>
                  <button
                    type="button"
                    class="period-btn"
                    :class="{ active: timePeriod === 'PM' }"
                    @click="timePeriod = 'PM'"
                  >
                    오후
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 예식장 위치 -->
          <div class="form-section">
            <h3>예식장 위치</h3>
            <div class="form-group full-width">
              <label for="wedding-location">주소 *</label>
              <div class="location-input-group">
                <input
                  id="wedding-location"
                  v-model="formData.wedding_location"
                  type="text"
                  placeholder="서울특별시 강남구 테헤란로 123"
                  required
                />
                <button type="button" class="search-btn" @click="searchLocation">
                  🔍 지도 검색
                </button>
              </div>
            </div>
            <div class="form-group full-width">
              <label for="location-detail">상세 주소</label>
              <input
                id="location-detail"
                v-model="formData.wedding_location_detail"
                type="text"
                placeholder="그랜드볼룸 3층"
              />
            </div>
            
            <!-- 지도 정보 표시 -->
            <div v-if="mapInfo" class="map-info">
              <p><strong>📍 위치:</strong> {{ mapInfo.formatted_address }}</p>
              <p><strong>🗺️ 좌표:</strong> {{ mapInfo.lat.toFixed(6) }}, {{ mapInfo.lng.toFixed(6) }}</p>
              <!-- 카카오 지도 표시 영역 -->
              <div id="kakao-map" class="kakao-map-container"></div>
              <!-- 지도 링크 -->
              <div class="map-links">
                <a :href="`https://map.kakao.com/link/map/${mapInfo.formatted_address},${mapInfo.lat},${mapInfo.lng}`" target="_blank" class="map-link">
                  🗺️ 카카오맵에서 보기
                </a>
                <a :href="`https://map.kakao.com/link/to/${mapInfo.formatted_address},${mapInfo.lat},${mapInfo.lng}`" target="_blank" class="map-link">
                  🚗 길찾기
                </a>
              </div>
            </div>
          </div>

          <!-- 추가 멘트 -->
          <div class="form-section">
            <h3>추가 멘트 (선택사항)</h3>
            <div class="form-group full-width">
              <label for="additional-message">원하는 문구를 입력해주세요</label>
              <textarea
                id="additional-message"
                v-model="formData.additional_message"
                rows="4"
                placeholder="예: 주차 안내, 드레스 코드 등"
              ></textarea>
            </div>
          </div>

          <!-- 제출 버튼 -->
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="handleClose">취소</button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? '저장 중...' : '저장하고 다음' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, computed } from 'vue'
import { invitationService, type InvitationBasicInfo, type MapInfo } from '@/services/invitationService'

interface Props {
  show: boolean
  savedInfo?: InvitationBasicInfo & { mapInfo?: MapInfo } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: InvitationBasicInfo & { mapInfo?: MapInfo }]
  close: []
}>()

const loading = ref(false)
const mapInfo = ref<MapInfo | null>(null)
const hasSavedInfo = ref(false)

// 시간 관련 상태
const timeHour = ref('')
const timeMinute = ref('')
const timePeriod = ref<'AM' | 'PM'>('AM')

const formData = reactive<InvitationBasicInfo>({
  groom_name: '',
  bride_name: '',
  groom_father_name: '',
  groom_mother_name: '',
  bride_father_name: '',
  bride_mother_name: '',
  wedding_date: '',
  wedding_time: '',
  wedding_location: '',
  wedding_location_detail: '',
  additional_message: ''
})

// 시간 조합하여 formData에 반영
watch([timeHour, timeMinute, timePeriod], () => {
  if (timeHour.value && timeMinute.value) {
    let hour = parseInt(timeHour.value, 10)
    if (timePeriod.value === 'PM' && hour < 12) {
      hour += 12
    } else if (timePeriod.value === 'AM' && hour === 12) {
      hour = 0
    }
    formData.wedding_time = `${String(hour).padStart(2, '0')}:${timeMinute.value.padStart(2, '0')}`
  }
})

// 날짜 입력 관련 함수들
function formatDateValue(digits: string): string {
  if (digits.length <= 4) {
    return digits
  } else if (digits.length <= 6) {
    return digits.slice(0, 4) + '-' + digits.slice(4, 6)
  } else {
    return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8)
  }
}

function handleDateKeydown(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement
  const key = event.key
  
  // 허용: 숫자, 백스페이스, 화살표, Tab, Enter
  if (
    (key >= '0' && key <= '9') ||
    key === 'Backspace' ||
    key === 'Delete' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'Tab' ||
    key === 'Enter'
  ) {
    // 숫자 입력 시 자동 포맷팅
    if (key >= '0' && key <= '9') {
      event.preventDefault()
      const digits = input.value.replace(/\D/g, '') + key
      const formatted = formatDateValue(digits.slice(0, 8))
      formData.wedding_date = formatted
      nextTick(() => {
        input.value = formatted
        input.setSelectionRange(formatted.length, formatted.length)
      })
    }
    return
  }
  
  // 그 외 키는 차단
  event.preventDefault()
}

function handleDateInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  // 이미 올바른 형식이면 그대로 사용
  if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    formData.wedding_date = value
    return
  }
  
  // 숫자만 추출하여 포맷팅
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const formatted = formatDateValue(digits)
  formData.wedding_date = formatted
  
  nextTick(() => {
    if (input.value !== formatted) {
      input.value = formatted
    }
  })
}

function handleDatePaste(event: ClipboardEvent) {
  event.preventDefault()
  const input = event.target as HTMLInputElement
  const pastedText = event.clipboardData?.getData('text') || ''
  const digits = pastedText.replace(/\D/g, '').slice(0, 8)
  const formatted = formatDateValue(digits)
  
  formData.wedding_date = formatted
  
  nextTick(() => {
    input.value = formatted
    input.setSelectionRange(formatted.length, formatted.length)
  })
}

// 시간 입력 관련 함수들
function handleHourInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  
  if (value.length > 2) {
    timeHour.value = value.slice(0, 2)
  } else {
    timeHour.value = value
  }
  
  const hourNum = parseInt(value, 10)
  if (!isNaN(hourNum)) {
    // 13시 이상이면 자동으로 오후로 변경하고 12시간 형식으로 변환
    if (hourNum >= 13 && hourNum <= 23) {
      timePeriod.value = 'PM'
      timeHour.value = String(hourNum - 12)
    } else if (hourNum === 0) {
      timePeriod.value = 'AM'
      timeHour.value = '12'
    } else if (hourNum > 23) {
      timeHour.value = '12'
    } else if (hourNum > 12) {
      timeHour.value = '12'
    }
  }
}

function handleMinuteInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  
  if (value.length > 2) {
    timeMinute.value = value.slice(0, 2)
  } else {
    timeMinute.value = value
  }
  
  const minuteNum = parseInt(value, 10)
  if (!isNaN(minuteNum) && minuteNum > 59) {
    timeMinute.value = '59'
  }
}

// 저장된 시간 파싱
function parseTimeFromString(timeStr: string) {
  if (!timeStr) return
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (match) {
    let hour = parseInt(match[1], 10)
    const minute = match[2]
    
    if (hour >= 12) {
      timePeriod.value = 'PM'
      if (hour > 12) hour -= 12
    } else {
      timePeriod.value = 'AM'
      if (hour === 0) hour = 12
    }
    
    timeHour.value = String(hour)
    timeMinute.value = minute
  }
}

// 저장된 정보가 있으면 로드
watch(() => props.savedInfo, (newInfo) => {
  if (newInfo) {
    hasSavedInfo.value = true
    Object.assign(formData, {
      groom_name: newInfo.groom_name || '',
      bride_name: newInfo.bride_name || '',
      groom_father_name: newInfo.groom_father_name || '',
      groom_mother_name: newInfo.groom_mother_name || '',
      bride_father_name: newInfo.bride_father_name || '',
      bride_mother_name: newInfo.bride_mother_name || '',
      wedding_date: newInfo.wedding_date || '',
      wedding_time: newInfo.wedding_time || '',
      wedding_location: newInfo.wedding_location || '',
      wedding_location_detail: newInfo.wedding_location_detail || '',
      additional_message: newInfo.additional_message || ''
    })
    // 시간 정보 파싱
    if (newInfo.wedding_time) {
      parseTimeFromString(newInfo.wedding_time)
    }
    if (newInfo.mapInfo) {
      mapInfo.value = newInfo.mapInfo
    }
  }
}, { immediate: true })

// Kakao Maps 타입 선언
declare global {
  interface Window {
    kakao: any
  }
}

const searchLocation = async () => {
  if (!formData.wedding_location) {
    alert('주소를 입력해주세요.')
    return
  }

  loading.value = true
  
  // 카카오 지도 서비스 사용
  if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
    const geocoder = new window.kakao.maps.services.Geocoder()
    
    geocoder.addressSearch(formData.wedding_location, (result: any[], status: any) => {
      loading.value = false
      
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = result[0]
        mapInfo.value = {
          lat: parseFloat(coords.y),
          lng: parseFloat(coords.x),
          formatted_address: coords.address_name || formData.wedding_location,
          map_image_url: '' // 카카오는 동적 지도 사용
        }
        
        // 지도 표시
        nextTick(() => {
          displayKakaoMap(mapInfo.value!.lat, mapInfo.value!.lng)
        })
      } else {
        alert('주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.')
      }
    })
  } else {
    // 카카오 SDK가 로드되지 않은 경우 백엔드 API 사용
    try {
      const response = await invitationService.getMapInfo(formData.wedding_location)
      mapInfo.value = response.data
    } catch (error) {
      console.error('지도 정보 조회 실패:', error)
      alert('지도 정보를 가져오는데 실패했습니다.')
    } finally {
      loading.value = false
    }
  }
}

// 카카오 지도 표시 함수
const displayKakaoMap = (lat: number, lng: number) => {
  const mapContainer = document.getElementById('kakao-map')
  if (!mapContainer || !window.kakao || !window.kakao.maps) return
  
  const mapOption = {
    center: new window.kakao.maps.LatLng(lat, lng),
    level: 3
  }
  
  const map = new window.kakao.maps.Map(mapContainer, mapOption)
  
  // 마커 추가
  const markerPosition = new window.kakao.maps.LatLng(lat, lng)
  const marker = new window.kakao.maps.Marker({
    position: markerPosition
  })
  marker.setMap(map)
  
  // 인포윈도우 추가
  const infowindow = new window.kakao.maps.InfoWindow({
    content: `<div style="padding:5px;font-size:12px;">${formData.wedding_location}</div>`
  })
  infowindow.open(map, marker)
}

const handleSubmit = () => {
  emit('submit', { ...formData, mapInfo: mapInfo.value || undefined })
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
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
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #495057;
}

.modal-body {
  padding: 1.5rem;
}

.info-text {
  background: #e7f3ff;
  padding: 1rem;
  border-radius: 8px;
  color: #0066cc;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  font-size: 1.1rem;
  color: #495057;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.location-input-group {
  display: flex;
  gap: 0.5rem;
}

.location-input-group input {
  flex: 1;
}

.search-btn {
  padding: 0.75rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.3s;
}

.search-btn:hover {
  background: #5568d3;
}

.map-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.map-info p {
  margin: 0.5rem 0;
  color: #495057;
}

.map-preview {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  margin-top: 0.5rem;
}

/* 카카오 지도 스타일 */
.kakao-map-container {
  width: 100%;
  height: 250px;
  border-radius: 12px;
  margin-top: 1rem;
  overflow: hidden;
  border: 2px solid #dee2e6;
}

.map-links {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.map-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #FEE500;
  color: #191919;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s;
}

.map-link:hover {
  background: #FAD800;
  transform: translateY(-2px);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 날짜 입력 스타일 */
.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-input-wrapper input {
  flex: 1;
  padding-right: 2.5rem;
}

.date-input-wrapper .input-icon {
  position: absolute;
  right: 0.75rem;
  color: #6c757d;
  font-size: 1.2rem;
  pointer-events: none;
}

/* 시간 입력 스타일 */
.time-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-input {
  width: 55px;
  text-align: center;
  padding: 0.75rem 0.25rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
}

.time-separator {
  color: #6c757d;
  font-size: 1.2rem;
  font-weight: 600;
}

.period-btn {
  padding: 0.75rem 1rem;
  border: 2px solid #dee2e6;
  background: white;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  color: #495057;
}

.period-btn:hover {
  border-color: #667eea;
  background: #f0f2ff;
}

.period-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .location-input-group {
    flex-direction: column;
  }
  
  .time-input-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  
  .time-inputs {
    justify-content: center;
  }
  
  .period-buttons {
    justify-content: center;
  }
}
</style>

