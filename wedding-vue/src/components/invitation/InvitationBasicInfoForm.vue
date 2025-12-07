<template>
  <div class="basic-info-form">
    <h2>청첩장 기본 정보</h2>
    
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
            <input
              id="wedding-date"
              v-model="formData.wedding_date"
              type="date"
              required
            />
          </div>
          <div class="form-group">
            <label for="wedding-time">예식 시간</label>
            <input
              id="wedding-time"
              v-model="formData.wedding_time"
              type="time"
              placeholder="14:00"
            />
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
              @blur="handleLocationBlur"
            />
            <button type="button" class="search-btn" @click="searchLocation" :disabled="loading || !formData.wedding_location">
              {{ loading ? '검색 중...' : '🔍 지도 검색' }}
            </button>
          </div>
          <p class="help-text">주소를 입력한 후 지도 검색 버튼을 클릭하거나 입력 필드를 벗어나면 자동으로 검색됩니다.</p>
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
          <div class="map-header">
            <h4>📍 위치 정보</h4>
            <button type="button" class="refresh-btn" @click="searchLocation" :disabled="loading">
              🔄 새로고침
            </button>
          </div>
          <p class="map-address"><strong>주소:</strong> {{ mapInfo.formatted_address }}</p>
          <p class="map-coords"><strong>좌표:</strong> {{ mapInfo.lat.toFixed(6) }}, {{ mapInfo.lng.toFixed(6) }}</p>
          <div v-if="mapInfo.map_image_url" class="map-image-container">
            <img :src="mapInfo.map_image_url" alt="약도" class="map-preview" />
            <p class="map-note">위 약도를 청첩장에 포함할 수 있습니다.</p>
          </div>
          <div v-else class="map-loading">
            <p>약도 이미지를 생성하는 중...</p>
          </div>
        </div>
        <div v-else-if="formData.wedding_location && !loading" class="map-placeholder">
          <p>📍 주소를 입력하고 지도 검색 버튼을 클릭하여 약도를 생성하세요.</p>
        </div>
      </div>

      <!-- 추가 멘트 -->
      <div class="form-section">
        <h3>추가 멘트</h3>
        <div class="form-group full-width">
          <label for="additional-message">특별한 말씀이 있으신가요?</label>
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
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '처리 중...' : '다음 단계로' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { invitationService, type InvitationBasicInfo, type MapInfo } from '@/services/invitationService'

const emit = defineEmits<{
  submit: [data: InvitationBasicInfo & { mapInfo?: MapInfo }]
}>()

const loading = ref(false)
const mapInfo = ref<MapInfo | null>(null)

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

const searchLocation = async () => {
  if (!formData.wedding_location) {
    alert('주소를 입력해주세요.')
    return
  }

  loading.value = true
  try {
    const response = await invitationService.getMapInfo(formData.wedding_location)
    mapInfo.value = response.data
    console.log('지도 정보 조회 성공:', mapInfo.value)
  } catch (error: any) {
    console.error('지도 정보 조회 실패:', error)
    const errorMessage = error?.response?.data?.message || '지도 정보를 가져오는데 실패했습니다.'
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}

// 주소 입력 필드에서 포커스가 벗어날 때 자동 검색
const handleLocationBlur = () => {
  if (formData.wedding_location && !mapInfo.value) {
    // 주소가 입력되어 있고 아직 지도 정보가 없으면 자동 검색
    searchLocation()
  }
}

const handleSubmit = () => {
  emit('submit', { ...formData, mapInfo: mapInfo.value || undefined })
}
</script>

<style scoped>
.basic-info-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
  text-align: center;
}

.form-section {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.form-section h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 0.5rem;
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

label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
  font-size: 0.95rem;
}

input,
textarea {
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #007bff;
}

.location-input-group {
  display: flex;
  gap: 0.5rem;
}

.location-input-group input {
  flex: 1;
}

.search-btn {
  padding: 0.75rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  background: #218838;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.help-text {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.5rem;
  font-style: italic;
}

.map-info {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e9ecef;
}

.map-header h4 {
  margin: 0;
  color: #007bff;
  font-size: 1.1rem;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #007bff;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.map-info p {
  margin: 0.75rem 0;
  color: #495057;
  line-height: 1.6;
}

.map-address {
  font-size: 1rem;
}

.map-coords {
  font-size: 0.9rem;
  color: #6c757d;
}

.map-image-container {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.map-preview {
  width: 100%;
  max-width: 600px;
  height: auto;
  border-radius: 12px;
  margin-top: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 2px solid #e9ecef;
}

.map-note {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #28a745;
  font-style: italic;
}

.map-loading {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  color: #6c757d;
}

.map-placeholder {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  text-align: center;
  color: #856404;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.submit-btn {
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .location-input-group {
    flex-direction: column;
  }
}
</style>
