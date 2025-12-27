<template>
  <div class="invitation-view">
    <div class="container">
      <h1>✨ 청첩장 만들기</h1>
      <p class="workflow-description">
        단계별로 진행되는 청첩장 제작 프로세스입니다. 각 단계를 순서대로 완료해주세요.
      </p>
      
      <!-- 진행 상태 표시 -->
      <div class="progress-bar">
        <div
          v-for="step in steps"
          :key="step.number"
          class="progress-step"
          :class="{
            active: currentStep === step.number,
            completed: getStepCompleted(step.number),
            locked: !canAccessStep(step.number) && currentStep !== step.number
          }"
          @click="handleStepClick(step.number)"
        >
          <div class="step-circle">
            <span v-if="getStepCompleted(step.number)">✓</span>
            <span v-else>{{ step.number }}</span>
          </div>
          <div class="step-info">
          <div class="step-label">{{ step.label }}</div>
            <div class="step-description-small">{{ step.description }}</div>
          </div>
        </div>
      </div>

      <!-- 기본 정보 입력 모달 -->
      <InvitationBasicInfoModal
        :show="showBasicInfoModal"
        :saved-info="savedBasicInfo"
        @submit="handleBasicInfoSubmit"
        @close="showBasicInfoModal = false"
      />

      <!-- Step 1: 메인 사진 업로드 (FE 스타일) -->
      <div v-if="currentStep === 1" class="step-content">
        <div v-if="!canAccessStep(1)" class="access-denied">
          <p>⚠️ 먼저 기본 정보를 입력해주세요.</p>
          <button class="back-btn" @click="showBasicInfoModal = true">기본 정보 입력하기</button>
        </div>
        <div v-else>
          <div class="step-header">
            <h2>STEP 1 청첩장 메인 사진 업로드</h2>
            <p class="step-description">
              웨딩 촬영 사진, 일상 사진, 연애 사진 등 다양한 사진을 올려주세요.
            </p>
          </div>
          
          <div class="image-upload-section">
            <input
              type="file"
              ref="mainImageInput"
              accept="image/*"
              @change="handleMainImageChange"
              class="file-input"
              style="display: none;"
            />
            
            <div v-if="!mainImage" class="upload-area" @click="mainImageInput?.click()">
              <div class="upload-placeholder">
                <span class="upload-icon">📸</span>
                <span class="upload-text">메인 사진 선택</span>
                <span class="upload-hint">고화질 이미지를 권장합니다 (최소 1000x1000 픽셀)</span>
              </div>
            </div>
            
            <div v-else class="image-preview-container">
              <div class="image-preview">
                <img :src="getImagePreview(mainImage)" alt="메인 사진 미리보기" />
                <button type="button" class="remove-image-btn" @click="removeMainImage">×</button>
              </div>
            </div>
          </div>
          
          <div class="step-actions">
            <button class="back-btn" @click="showBasicInfoModal = true">← 기본 정보 수정</button>
            <button
              class="next-btn"
              @click="handleNextFromMainImage"
              :disabled="!mainImage"
            >
              다음 단계 →
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: 톤 선택 (6가지 고정 톤) -->
      <div v-if="currentStep === 2" class="step-content">
        <div v-if="!canAccessStep(2)" class="access-denied">
          <p>⚠️ 먼저 메인 사진을 업로드해주세요.</p>
          <button class="back-btn" @click="currentStep = 1">메인 사진 업로드하러 가기</button>
        </div>
        <div v-else>
          <div class="step-header">
            <h2>STEP 2 문구 톤 선택</h2>
            <p class="step-description">
              청첩장에 사용할 문구의 톤을 선택해주세요.
            </p>
          </div>
          
          <!-- 6가지 고정 톤 선택 (FE 스타일) -->
          <div class="tone-selection-grid">
            <div
              v-for="tone in fixedTones"
              :key="tone.value"
              class="tone-selection-card"
              :class="{ selected: selectedFixedTone === tone.value }"
              @click="selectFixedTone(tone)"
            >
              <div class="tone-card-header">
                <span class="tone-icon">{{ tone.icon }}</span>
                <h3>{{ tone.name }}</h3>
                <span v-if="selectedFixedTone === tone.value" class="tone-check">✓</span>
              </div>
              <p class="tone-description">{{ tone.description }}</p>
              <p class="tone-example">{{ tone.example }}</p>
            </div>
          </div>
          
          <div class="step-actions">
            <button class="back-btn" @click="currentStep--">← 이전</button>
            <button
              class="next-btn"
              @click="handleNextFromTone"
              :disabled="!selectedFixedTone"
            >
              다음 단계 →
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: 디자인 요청 사항 (스타일 이미지 업로드) -->
      <div v-if="currentStep === 3" class="step-content">
        <div v-if="!canAccessStep(3)" class="access-denied">
          <p>⚠️ 먼저 기본 정보 입력과 톤 선택을 완료해주세요.</p>
          <div class="access-actions">
            <button class="back-btn" @click="currentStep = 1" v-if="!stepCompleted.step1">기본 정보 입력하러 가기</button>
            <button class="back-btn" @click="currentStep = 2" v-if="stepCompleted.step1 && !stepCompleted.step2">톤 선택하러 가기</button>
          </div>
        </div>
        <div v-else>
          <div class="step-header">
            <h2>STEP 3 디자인 요청 사항</h2>
            <p class="step-description">
              원하는 스타일의 청첩장 이미지를 첨부해주세요.
            </p>
          </div>
          
          <!-- 스타일 이미지 업로드 (FE DesignDetailPage 스타일) -->
          <div class="style-images-section">
            <div class="style-images-uploader">
              <input
                type="file"
                ref="styleImagesInput"
                multiple
                accept="image/*"
                @change="handleStyleImagesChange"
                class="style-images-input"
              />
              
              <!-- 업로드 영역 -->
              <div class="upload-area" @click="styleImagesInput?.click()" v-if="styleImages.length < 3">
                <div class="upload-placeholder">
                  <span class="upload-icon">+</span>
                  <span class="upload-text">이미지 추가</span>
                  <span class="upload-count">{{ styleImages.length }}/3</span>
                </div>
              </div>
              
              <!-- 업로드된 이미지 미리보기 -->
              <div class="style-images-preview" v-if="styleImages.length > 0">
                <div
                  v-for="(file, index) in styleImages"
                  :key="index"
                  class="style-image-item"
                >
                  <div class="image-number">{{ index + 1 }}</div>
                  <img :src="getImagePreview(file)" :alt="`스타일 이미지 ${index + 1}`" />
                  <button type="button" class="remove-style-image" @click.stop="removeStyleImage(index)" aria-label="이미지 제거">×</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="step-actions">
            <button class="back-btn" @click="currentStep--">← 이전</button>
            <button
              class="next-btn"
              @click="handleNextFromStyleUpload"
              :disabled="false"
            >
              청첩장 만들기 →
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4: 디자인 생성 -->
      <div v-if="currentStep === 4" class="step-content">
        <div v-if="!canAccessStep(4)" class="access-denied">
          <p>⚠️ 먼저 이전 단계들을 완료해주세요.</p>
          <div class="access-actions">
            <button class="back-btn" @click="currentStep = 1" v-if="!stepCompleted.step1">요구사항 입력하러 가기</button>
            <button class="back-btn" @click="currentStep = 2" v-if="stepCompleted.step1 && !stepCompleted.step2">톤 선택하러 가기</button>
            <button class="back-btn" @click="currentStep = 3" v-if="stepCompleted.step2 && !stepCompleted.step3">스타일 업로드하러 가기</button>
          </div>
        </div>
        <div v-else>
          <div class="step-header">
            <h2>🎨 청첩장 디자인 생성</h2>
            <p class="step-description">
              선택한 톤과 스타일 이미지를 바탕으로 청첩장 디자인을 생성합니다.
            </p>
          </div>

          <InvitationDesignStep
            :selected-text="selectedTone?.main_text || ''"
            :selected-tone="selectedTone?.tone || ''"
            :basic-info="basicInfo"
            @generate="handleImageGenerate"
            ref="designGenerator"
          />
          <div class="step-actions">
            <button class="back-btn" @click="currentStep--">← 이전</button>
            <button
              class="next-btn"
              @click="handleNextFromDesign"
              :disabled="designGenerator?.loading || stepCompleted.step4"
            >
              {{ designGenerator?.loading ? '생성 중...' : (stepCompleted.step4 ? '다음 →' : '청첩장 만들기') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Step 5: 완료 (FE ResultPage 스타일) -->
      <div v-if="currentStep === 5" class="step-content completion">
        <div class="result-page">
          <div class="result-header">
            <h2>최종 결과</h2>
            <p class="result-hint">
              <span aria-hidden="true">📱</span> 좌우로 스와이프하여 {{ resultImages.length }}장의 청첩장을 확인하세요
            </p>
          </div>

          <!-- 스와이프 가능한 이미지 뷰어 (FE 스타일) -->
          <div class="viewer-card">
            <div class="viewer-top">
              <div class="viewer-badge">청첩장 {{ currentImageIndex + 1 }}</div>
              <div class="viewer-counter" aria-label="현재 {{ currentImageIndex + 1 }} / {{ resultImages.length }}">
                {{ currentImageIndex + 1 }} / {{ resultImages.length }}
              </div>
            </div>

            <div
              class="viewer"
              @touchstart="onTouchStart"
              @touchend="onTouchEnd"
              @keydown="handleViewerKeydown"
              tabindex="0"
            >
              <button
                type="button"
                class="viewer-arrow left"
                @click="goPrevImage"
                :disabled="currentImageIndex === 0"
                aria-label="이전 이미지"
              >
                ‹
              </button>

              <div
                class="viewer-track"
                :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
              >
                <div
                  v-for="(img, idx) in resultImages"
                  :key="idx"
                  class="viewer-slide"
                >
                  <div class="viewer-poster">
                    <img :src="img.src" :alt="img.title" class="viewer-img" />
                  </div>
                  <div class="viewer-meta">
                    <h3 class="viewer-title">{{ img.title }}</h3>
                    <p class="viewer-desc">{{ img.desc }}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="viewer-arrow right"
                @click="goNextImage"
                :disabled="currentImageIndex === resultImages.length - 1"
                aria-label="다음 이미지"
              >
                ›
              </button>
            </div>

            <!-- 이미지 인디케이터 -->
            <div class="viewer-dots" role="tablist" aria-label="청첩장 페이지">
              <button
                v-for="(_, i) in resultImages"
                :key="i"
                type="button"
                class="viewer-dot"
                :class="{ active: i === currentImageIndex }"
                @click="currentImageIndex = i"
                :aria-label="`${i + 1}번 이미지로 이동`"
                :aria-current="i === currentImageIndex ? 'true' : 'false'"
              />
            </div>
          </div>

          <!-- 액션 버튼들 -->
          <div class="result-actions">
            <button type="button" class="result-btn primary" @click="downloadAllImages">
              청첩장 {{ resultImages.length }}장 모두 다운로드
            </button>
            <button type="button" class="result-btn outline" @click="redoDesign">
              디자인 다시하기
            </button>
          </div>

          <!-- 기타 액션 버튼 -->
          <div class="completion-actions">
            <button class="list-btn" @click="goToList">📋 목록으로</button>
            <button class="new-btn" @click="createNew">✨ 새로 만들기</button>
            <button class="options-btn" @click="currentStep = 6">✨ 특별한 기능 선택하기</button>
          </div>
        </div>
      </div>

      <!-- Step 6: 특별한 기능 선택 (FE OptionSelectPage 스타일) -->
      <div v-if="currentStep === 6" class="step-content options-step">
        <div v-if="!canAccessStep(6)" class="access-denied">
          <p>⚠️ 먼저 이전 단계들을 완료해주세요.</p>
          <button class="back-btn" @click="currentStep = 5">완료 페이지로 돌아가기</button>
        </div>
        <div v-else>
          <div class="step-header">
            <p class="step-label">STEP 6</p>
            <h2>특별한 기능 선택하기</h2>
            <p class="step-description">
              청첩장을 더욱 특별하게 만들 기능을 선택하세요<br>
              원하는 만큼 여러 기능을 사용할 수 있습니다!
            </p>
          </div>

          <div class="options-grid">
            <!-- 3D 청첩장 옵션 -->
            <div class="option-card blue">
              <div class="option-top">
                <div class="option-icon">🎨</div>
                <h3 class="option-title">3D 청첩장 만들기</h3>
              </div>
              <p class="option-desc">신랑신부의 3D 캐릭터로 특별한 청첩장 제작</p>
              <ul class="option-bullets">
                <li>3D 캐릭터 생성</li>
                <li>같이 나온 사진 3장 필요</li>
                <li>몸의 60~70% 사진</li>
              </ul>
              <button class="option-btn" @click="handleSelectOption('3d')">
                시작하기
              </button>
            </div>

            <!-- 영화 포스터 옵션 -->
            <div class="option-card purple">
              <div class="option-top">
                <div class="option-icon">🎬</div>
                <h3 class="option-title">영화 포스터 만들기</h3>
              </div>
              <p class="option-desc">좋아하는 영화/드라마 포스터에 신랑신부 얼굴 합성</p>
              <ul class="option-bullets">
                <li>포스터 이미지 업로드</li>
                <li>같이 나온 사진 최대 3장</li>
                <li>커스텀 문구 입력</li>
              </ul>
              <button class="option-btn" @click="handleSelectOption('poster')">
                시작하기
              </button>
            </div>

            <!-- 완료된 기능 표시 -->
            <div v-if="stepCompleted.step7 && selectedSpecialFeature" class="completed-features">
              <div class="completed-badge">
                <span v-if="selectedSpecialFeature === '3d'">✅ 3D 청첩장 완료</span>
                <span v-if="selectedSpecialFeature === 'poster'">✅ 영화 포스터 완료</span>
              </div>
              <p class="completed-hint">다른 기능도 사용하고 싶으시면 위에서 선택해주세요!</p>
            </div>
          </div>

          <div class="tip-box">
            <div class="tip-title">💡 Tip</div>
            <ul class="tip-list">
              <li>각 기능은 독립적으로 작동하며, 원하는 순서대로 사용할 수 있습니다</li>
              <li>한 기능을 완료한 후 이 화면으로 돌아와 다른 기능을 선택할 수 있습니다</li>
              <li>모든 기능을 사용할 필요는 없고, 원하는 기능만 선택하세요</li>
              <li>완료된 기능은 언제든지 다시 만들 수 있습니다</li>
            </ul>
          </div>

          <div class="step-actions">
            <button class="back-btn" @click="currentStep = 5">← 결과로 돌아가기</button>
          </div>
        </div>
      </div>

      <!-- Step 7: 특별 기능 진행 (선택한 기능에 따라 동적 표시) -->
      <div v-if="currentStep === 7" class="step-content">
        <!-- 3D 청첩장 만들기 -->
        <div v-if="selectedSpecialFeature === '3d'" class="threed-step">
          <div class="step-header">
            <h2>🎨 3D 청첩장 만들기</h2>
            <p class="step-description">
              우리만의 사진으로 특별한 3D 청첩장을 만들 수 있어요!
            </p>
          </div>

        <!-- 메인 이미지 (필수) -->
        <section class="threed-section">
          <div class="section-header">
            <div class="section-title">
              1. 메인 사진 <span class="req">*</span>
            </div>
            <div v-if="threeDMainImage" class="pill-ok">업로드 완료</div>
          </div>
          
          <input
            type="file"
            ref="threeDMainImageInput"
            accept="image/*"
            @change="handleThreeDMainImageChange"
            class="file-input"
            style="display: none;"
          />
          
          <div v-if="!threeDMainImage" class="upload-area" @click="threeDMainImageInput?.click()">
            <div class="upload-placeholder">
              <span class="upload-icon">📸</span>
              <span class="upload-text">메인 사진 선택</span>
              <span class="upload-hint">신랑/신부가 함께 나온 대표 사진 1장을 올려주세요</span>
            </div>
          </div>
          
          <div v-else class="image-preview-container">
            <div class="image-preview">
              <img :src="getImagePreview(threeDMainImage)" alt="메인 사진 미리보기" />
              <button type="button" class="remove-image-btn" @click="removeThreeDMainImage">×</button>
            </div>
          </div>
        </section>

        <!-- 레퍼런스 이미지 (선택) -->
        <section class="threed-section">
          <div class="section-header">
            <div class="section-title">2. 레퍼런스 사진 (선택, 최대 2장)</div>
            <div class="hint-text">원하는 분위기/포즈 참고용 (없어도 진행 가능)</div>
          </div>
          
          <input
            type="file"
            ref="threeDReferenceImagesInput"
            accept="image/*"
            multiple
            @change="handleThreeDReferenceImagesChange"
            class="file-input"
            style="display: none;"
          />
          
          <div v-if="threeDReferenceImages.length < 2" class="upload-area" @click="threeDReferenceImagesInput?.click()">
            <div class="upload-placeholder">
              <span class="upload-icon">+</span>
              <span class="upload-text">레퍼런스 사진 추가</span>
              <span class="upload-count">{{ threeDReferenceImages.length }}/2</span>
            </div>
          </div>
          
          <div v-if="threeDReferenceImages.length > 0" class="reference-images-preview">
            <div
              v-for="(file, index) in threeDReferenceImages"
              :key="index"
              class="reference-image-item"
            >
              <div class="image-number">{{ index + 1 }}</div>
              <img :src="getImagePreview(file)" :alt="`레퍼런스 이미지 ${index + 1}`" />
              <button type="button" class="remove-image-btn" @click="removeThreeDReferenceImage(index)">×</button>
            </div>
          </div>
        </section>

        <!-- 상태 표시 -->
        <div v-if="threeDStatus !== 'IDLE'" class="threed-status">
          <div class="status-pill" :class="`status-${threeDStatus.toLowerCase()}`">
            <span v-if="threeDStatus === 'SUBMITTED'">요청 전송</span>
            <span v-if="threeDStatus === 'PENDING'">대기 중</span>
            <span v-if="threeDStatus === 'RUNNING'">생성 중 (최대 10분)</span>
            <span v-if="threeDStatus === 'DONE'">완료</span>
            <span v-if="threeDStatus === 'FAILED'">실패</span>
            <span v-if="threeDStatus === 'CANCELED'">취소됨</span>
          </div>
          <div v-if="threeDError" class="error-message">{{ threeDError }}</div>
        </div>

        <!-- 버튼 -->
        <div class="step-actions">
          <button class="back-btn" @click="currentStep = 6">← 특별한 기능 선택으로</button>
          <button
            v-if="['SUBMITTED', 'PENDING', 'RUNNING'].includes(threeDStatus)"
            class="danger-btn"
            @click="stopThreeDPolling"
          >
            생성 취소
          </button>
          <button
            v-else-if="threeDStatus !== 'DONE'"
            class="next-btn"
            @click="handleThreeDSubmit"
            :disabled="!threeDMainImage || ['SUBMITTED', 'PENDING', 'RUNNING'].includes(threeDStatus)"
          >
            3D 청첩장 생성하기
          </button>
          <button
            v-else
            class="next-btn"
            @click="currentStep = 6"
          >
            특별 기능 선택으로 돌아가기
          </button>
        </div>

        <div v-if="!threeDMainImage" class="notice">
          * 메인 사진 1장은 반드시 업로드해야 생성할 수 있어요
        </div>
        </div>

        <!-- 영화 포스터 만들기 -->
        <div v-else-if="selectedSpecialFeature === 'poster'" class="poster-step">
          <div class="step-header">
            <h2>🎬 영화 포스터 만들기</h2>
            <p class="step-description">
              좋아하는 영화/드라마 포스터에 신랑신부 얼굴을 합성하여 특별한 포스터를 만들어보세요!
            </p>
          </div>

          <!-- 포스터 이미지 업로드 -->
          <section class="poster-section">
            <div class="section-header">
              <div class="section-title">
                1. 포스터 이미지 <span class="req">*</span>
              </div>
              <div v-if="posterImage" class="pill-ok">업로드 완료</div>
            </div>
            
            <input
              type="file"
              ref="posterImageInput"
              accept="image/*"
              @change="handlePosterImageChange"
              class="file-input"
              style="display: none;"
            />
            
            <div v-if="!posterImage" class="upload-area" @click="posterImageInput?.click()">
              <div class="upload-placeholder">
                <span class="upload-icon">🎬</span>
                <span class="upload-text">포스터 이미지 선택</span>
                <span class="upload-hint">합성하고 싶은 영화/드라마 포스터 이미지를 업로드하세요</span>
              </div>
            </div>
            
            <div v-else class="image-preview-container">
              <div class="image-preview">
                <img :src="getImagePreview(posterImage)" alt="포스터 이미지 미리보기" />
                <button type="button" class="remove-image-btn" @click="removePosterImage">×</button>
              </div>
            </div>
          </section>

          <!-- 신랑신부 사진 업로드 -->
          <section class="poster-section">
            <div class="section-header">
              <div class="section-title">
                2. 신랑신부 사진 (최대 3장) <span class="req">*</span>
              </div>
              <div v-if="posterMainImages.length > 0" class="pill-ok">{{ posterMainImages.length }}장 업로드 완료</div>
            </div>
            
            <input
              type="file"
              ref="posterMainImagesInput"
              accept="image/*"
              multiple
              @change="handlePosterMainImagesChange"
              class="file-input"
              style="display: none;"
            />
            
            <div v-if="posterMainImages.length < 3" class="upload-area" @click="posterMainImagesInput?.click()">
              <div class="upload-placeholder">
                <span class="upload-icon">📸</span>
                <span class="upload-text">사진 추가</span>
                <span class="upload-hint">신랑신부가 함께 나온 사진을 업로드하세요 (최대 3장)</span>
                <span class="upload-count">{{ posterMainImages.length }}/3</span>
              </div>
            </div>
            
            <div v-if="posterMainImages.length > 0" class="reference-images-preview">
              <div
                v-for="(file, index) in posterMainImages"
                :key="index"
                class="reference-image-item"
              >
                <div class="image-number">{{ index + 1 }}</div>
                <img :src="getImagePreview(file)" :alt="`사진 ${index + 1}`" />
                <button type="button" class="remove-image-btn" @click="removePosterMainImage(index)">×</button>
              </div>
            </div>
          </section>

          <!-- 커스텀 문구 입력 -->
          <section class="poster-section">
            <div class="section-header">
              <div class="section-title">3. 커스텀 문구 (선택)</div>
            </div>
            <textarea
              v-model="posterCustomText"
              rows="4"
              placeholder="포스터에 추가하고 싶은 문구를 입력하세요 (예: '우리의 이야기가 시작됩니다', '2025.03.15')"
              class="custom-text-input"
            ></textarea>
          </section>

          <!-- 상태 표시 -->
          <div v-if="posterStatus !== 'IDLE'" class="poster-status">
            <div class="status-pill" :class="`status-${posterStatus.toLowerCase()}`">
              <span v-if="posterStatus === 'PROCESSING'">처리 중...</span>
              <span v-if="posterStatus === 'DONE'">완료</span>
              <span v-if="posterStatus === 'FAILED'">실패</span>
            </div>
            <div v-if="posterError" class="error-message">{{ posterError }}</div>
          </div>

          <!-- 결과 표시 -->
          <div v-if="posterResultUrl && posterStatus === 'DONE'" class="poster-result">
            <h3>생성된 포스터</h3>
            <div class="result-image-container">
              <img :src="posterResultUrl" alt="생성된 포스터" />
            </div>
            <div class="result-actions">
              <button class="download-btn" @click="downloadPoster">다운로드</button>
              <button class="share-btn" @click="sharePoster">공유하기</button>
            </div>
          </div>

          <!-- 버튼 -->
          <div class="step-actions">
            <button class="back-btn" @click="currentStep = 6">← 특별한 기능 선택으로</button>
            <button
              v-if="posterStatus !== 'DONE'"
              class="next-btn"
              @click="handlePosterSubmit"
              :disabled="!posterImage || posterMainImages.length === 0 || posterStatus === 'PROCESSING'"
            >
              {{ posterStatus === 'PROCESSING' ? '처리 중...' : '포스터 만들기' }}
            </button>
            <button
              v-else
              class="next-btn"
              @click="currentStep = 6"
            >
              특별 기능 선택으로 돌아가기
            </button>
          </div>

          <div v-if="!posterImage || posterMainImages.length === 0" class="notice">
            * 포스터 이미지와 신랑신부 사진은 필수입니다
          </div>
        </div>

        <!-- 선택한 기능이 없을 때 -->
        <div v-else class="access-denied">
          <p>⚠️ 특별 기능을 선택해주세요.</p>
          <button class="back-btn" @click="currentStep = 6">특별한 기능 선택으로</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import InvitationBasicInfoModal from '@/components/invitation/InvitationBasicInfoModal.vue'
import InvitationRequirementsForm from '@/components/invitation/InvitationRequirementsForm.vue'
import InvitationToneSelector from '@/components/invitation/InvitationToneSelector.vue'
import InvitationDesignStep from '@/components/invitation/InvitationDesignStep.vue'
import InvitationDesignModifier from '@/components/invitation/InvitationDesignModifier.vue'
import { invitationService, type InvitationBasicInfo, type ToneOption, type MapInfo } from '@/services/invitationService'
import { useApi } from '@/composables/useApi'

const router = useRouter()
const { request } = useApi()

const currentStep = ref(1)
const steps = [
  { number: 1, label: '메인 사진', description: '업로드' },
  { number: 2, label: '톤 선택', description: '6가지 톤 중 선택' },
  { number: 3, label: '디자인 요청', description: '스타일 이미지 업로드' },
  { number: 4, label: '디자인 생성', description: '청첩장 디자인 생성' },
  { number: 5, label: '완료', description: '청첩장 완성' },
  { number: 6, label: '특별한 기능', description: '추가 기능 선택' },
  { number: 7, label: '특별 기능 진행', description: '선택한 기능 진행' }
]

// 기본 정보 모달
const showBasicInfoModal = ref(false)
const savedBasicInfo = ref<InvitationBasicInfo & { mapInfo?: MapInfo } | null>(null)

// 선택한 특별 기능 타입
const selectedSpecialFeature = ref<'3d' | 'poster' | null>(null)

// 단계별 완료 상태 관리
const stepCompleted = ref({
  step0: false, // 기본 정보 입력 완료 (모달에서)
  step1: false, // 메인 사진 업로드 완료
  step2: false, // 톤 선택 완료
  step3: false, // 디자인 요청 완료
  step4: false, // 디자인 생성 완료
  step5: false, // 완료 단계
  step6: false, // 특별한 기능 선택 완료
  step7: false  // 특별 기능 진행 완료
})

// 요구사항 입력 데이터
const requirements = ref('')

// Step 1 data
const basicInfo = ref<InvitationBasicInfo & { mapInfo?: MapInfo }>()

// 메인 사진 업로드 (FE 스타일)
const mainImage = ref<File | null>(null)
const mainImageInput = ref<HTMLInputElement>()

// Step 2 data - 6가지 고정 톤
const fixedTones = [
  {
    value: 'formal',
    name: '격식있는',
    icon: '🎩',
    description: '전통적이고 예의바른 표현',
    example: '상기 정중히...'
  },
  {
    value: 'warm',
    name: '따뜻한',
    icon: '💕',
    description: '정겹고 포근한 느낌',
    example: '따뜻한 마음으로 초대합니다'
  },
  {
    value: 'modern',
    name: '현대적인',
    icon: '✨',
    description: '세련되고 트렌디한 표현',
    example: '저희의 새로운 시작에 함께 해 주세요'
  },
  {
    value: 'classic',
    name: '클래식',
    icon: '🌹',
    description: '고전적이고 우아한 분위기',
    example: '영원한 사랑을 약속하는 자리에'
  },
  {
    value: 'casual',
    name: '캐주얼',
    icon: '😊',
    description: '편안하고 친근한 느낌',
    example: '우리 결혼해요! 축하해주세요'
  },
  {
    value: 'romantic',
    name: '로맨틱',
    icon: '💖',
    description: '감성적이고 낭만적인 표현',
    example: '사랑이 꽃피는 그날, 함께해주세요'
  }
]

const selectedFixedTone = ref<string | null>(null)
const selectedTone = ref<ToneOption | null>(null) // 하위 호환성을 위해 유지
const tones = ref<ToneOption[]>([])
const loadingTones = ref(false)

// Step 3 data (디자인 생성)
const designGenerator = ref<InstanceType<typeof InvitationDesignStep>>()
const generatedImageUrl = ref('')
const generatedImageUrls = ref<string[]>([]) // 여러 이미지 지원 (FE 스타일)
const originalGeneratedImageUrl = ref('') // 원본 이미지 보존용
const designRequirements = ref('')
const styleImages = ref<File[]>([]) // 스타일 이미지 업로드 (FE 스타일)

// 3D 청첩장 관련 데이터
const threeDMainImage = ref<File | null>(null)
const threeDReferenceImages = ref<File[]>([])
const threeDStatus = ref<'IDLE' | 'SUBMITTED' | 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELED'>('IDLE')
const threeDInvitationId = ref<number | null>(null)
const threeDModelUrl = ref<string>('')
const threeDResultImageUrls = ref<string[]>([])
const threeDPollingTimer = ref<number | null>(null)
const threeDError = ref<string | null>(null)

// Step 4 data (커스텀)
const designModifier = ref<InstanceType<typeof InvitationDesignModifier>>()
const remainingCustomCount = ref(5) // 하루 5번 제한

// Design data
const designId = ref<number>()

// 컴포넌트 마운트 시: 기본 정보는 브라우저에 저장하지 않고, 매 세션 새로 입력받는다.
onMounted(() => {
  // 항상 기본 정보 입력 모달을 먼저 보여줌
  showBasicInfoModal.value = true

  // 커스텀 사용 횟수 로드 (하루 5회 제한은 유지)
  loadCustomCount()
})

// 커스텀 사용 횟수 로드
const loadCustomCount = () => {
  try {
    const today = new Date().toDateString()
    const saved = localStorage.getItem(`custom_count_${today}`)
    if (saved) {
      remainingCustomCount.value = Math.max(0, 5 - parseInt(saved))
    } else {
      remainingCustomCount.value = 5
    }
  } catch (error) {
    console.error('커스텀 사용 횟수 로드 실패:', error)
  }
}

// 단계 접근 제어 함수
const canAccessStep = (stepNumber: number): boolean => {
  if (stepNumber === 1) return stepCompleted.value.step0 // 기본 정보 입력 완료 필요
  if (stepNumber === 2) return stepCompleted.value.step0 && stepCompleted.value.step1 // 메인 사진 업로드 완료
  if (stepNumber === 3) return stepCompleted.value.step0 && stepCompleted.value.step1 && stepCompleted.value.step2 // 톤 선택 완료
  if (stepNumber === 4) return stepCompleted.value.step0 && stepCompleted.value.step1 && stepCompleted.value.step2 && stepCompleted.value.step3 // 디자인 요청 완료
  if (stepNumber === 5) return stepCompleted.value.step0 && stepCompleted.value.step1 && stepCompleted.value.step2 && stepCompleted.value.step3 && stepCompleted.value.step4 // 디자인 생성 완료
  if (stepNumber === 6) return stepCompleted.value.step0 && stepCompleted.value.step1 && stepCompleted.value.step2 && stepCompleted.value.step3 && stepCompleted.value.step4 // 3D 청첩장 (선택사항)
  return false
}

// 단계 완료 여부 확인
const getStepCompleted = (stepNumber: number): boolean => {
  if (stepNumber === 1) return stepCompleted.value.step1
  if (stepNumber === 2) return stepCompleted.value.step2
  if (stepNumber === 3) return stepCompleted.value.step3
  if (stepNumber === 4) return stepCompleted.value.step4
  if (stepNumber === 5) return stepCompleted.value.step5
  if (stepNumber === 6) return stepCompleted.value.step6
  if (stepNumber === 7) return stepCompleted.value.step7
  return false
}

// 단계 클릭 핸들러 (접근 가능한 단계만 이동)
const handleStepClick = (stepNumber: number) => {
  if (canAccessStep(stepNumber)) {
    currentStep.value = stepNumber
  } else {
    // 접근 불가능한 단계 클릭 시 안내
    const requiredSteps = []
    if (stepNumber >= 1 && !stepCompleted.value.step0) requiredSteps.push('기본 정보 입력')
    if (stepNumber >= 2 && !stepCompleted.value.step1) requiredSteps.push('요구사항 입력')
    if (stepNumber >= 3 && !stepCompleted.value.step2) requiredSteps.push('톤 선택')
    if (stepNumber >= 4 && !stepCompleted.value.step3) requiredSteps.push('디자인 생성')
    
    if (requiredSteps.length > 0) {
      alert(`먼저 ${requiredSteps.join(', ')}을(를) 완료해주세요.`)
    }
  }
}

// 기본 정보 제출 (모달에서)
const handleBasicInfoSubmit = async (data: InvitationBasicInfo & { mapInfo?: MapInfo }) => {
  basicInfo.value = data
  savedBasicInfo.value = data
  
  // Step 0 완료 표시
  stepCompleted.value.step0 = true
  showBasicInfoModal.value = false
  
  // 디자인 생성 (기본 정보 포함)
  try {
    const response = await invitationService.createDesign({
      groom_name: data.groom_name,
      bride_name: data.bride_name,
      groom_father_name: data.groom_father_name,
      groom_mother_name: data.groom_mother_name,
      bride_father_name: data.bride_father_name,
      bride_mother_name: data.bride_mother_name,
      wedding_date: data.wedding_date,
      wedding_time: data.wedding_time,
      wedding_location: data.wedding_location,
      wedding_location_detail: data.wedding_location_detail,
      map_address: data.wedding_location,
      additional_message: data.additional_message,
      design_data: {
        ...data,
        map_lat: data.mapInfo?.lat,
        map_lng: data.mapInfo?.lng,
        map_image_url: data.mapInfo?.map_image_url
      }
    })
    
    designId.value = response.data.id
    console.log('디자인 생성 성공:', designId.value)
  } catch (error) {
    console.error('디자인 생성 실패:', error)
    alert('디자인 생성에 실패했습니다.')
    return
  }
}

// Step 1: 메인 이미지 업로드 핸들러
const handleMainImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    mainImage.value = file
  }
}

const getImagePreview = (file: File): string => {
  return URL.createObjectURL(file)
}

const removeMainImage = () => {
  if (mainImage.value) {
    URL.revokeObjectURL(getImagePreview(mainImage.value))
    mainImage.value = null
  }
}

const handleNextFromMainImage = () => {
  if (!mainImage.value) {
    alert('메인 사진을 업로드해주세요.')
    return
  }
  
  // Step 1 완료 표시
  stepCompleted.value.step1 = true
  
  // Step 2로 이동 (톤 선택)
  currentStep.value = 2
}

// Step 1: 요구사항 제출 (더 이상 사용하지 않지만 하위 호환성을 위해 유지)
const handleRequirementsSubmit = async (req: string) => {
  requirements.value = req
  
  // Step 1 완료 표시는 메인 이미지 업로드에서 처리
  // 이 함수는 더 이상 사용하지 않음
}

// Step 2: 고정 톤 선택
const selectFixedTone = (tone: typeof fixedTones[0]) => {
  selectedFixedTone.value = tone.value
  
  // 선택한 톤을 ToneOption 형식으로 변환 (하위 호환성)
  selectedTone.value = {
    tone: tone.value,
    description: tone.description,
    main_text: tone.example,
    parents_greeting: '',
    wedding_info: '',
    closing: ''
  }
  
  // Step 2 완료 표시
  stepCompleted.value.step2 = true
}

// Step 2: 다음 단계
const handleNextFromTone = () => {
  if (!selectedFixedTone.value) {
    alert('톤을 선택해주세요.')
    return
  }
  
  // Step 2 완료 표시
  stepCompleted.value.step2 = true
  
  // Step 3로 이동 (스타일 이미지 업로드)
  currentStep.value = 3
}

// Step 3: 스타일 이미지 업로드 후 다음 단계
const handleNextFromStyleUpload = () => {
  // Step 3 완료 표시
  stepCompleted.value.step3 = true
  
  // Step 4로 이동 (디자인 생성)
  currentStep.value = 4
}

// Step 2: 톤 로드 (자동 생성)
const loadTones = async () => {
  console.log('🔄 loadTones 호출됨')
  console.log('basicInfo.value:', basicInfo.value)
  
  if (!basicInfo.value) {
    alert('기본 정보가 없습니다. 기본 정보를 먼저 입력해주세요.')
    showBasicInfoModal.value = true
    return
  }
  
  loadingTones.value = true
  try {
    // 기본 정보 + 요구사항을 함께 전달하여 톤 생성
    const toneRequest = {
      ...basicInfo.value,
      requirements: requirements.value // 요구사항 추가
    }
    
    console.log('📤 톤 생성 요청:', toneRequest)
    
    // requirements 필드를 additional_message로 매핑 (API 호환성)
    const response = await invitationService.generateTones({
      groom_name: toneRequest.groom_name,
      bride_name: toneRequest.bride_name,
      groom_father_name: toneRequest.groom_father_name,
      groom_mother_name: toneRequest.groom_mother_name,
      bride_father_name: toneRequest.bride_father_name,
      bride_mother_name: toneRequest.bride_mother_name,
      wedding_date: toneRequest.wedding_date,
      wedding_time: toneRequest.wedding_time,
      wedding_location: toneRequest.wedding_location,
      additional_message: toneRequest.additional_message,
      requirements: toneRequest.requirements // 요구사항 추가
    })
    
    console.log('📥 톤 생성 응답:', response)
    console.log('tones 배열:', response.data?.tones)
    
    // 배열이 제대로 전달되는지 확인
    if (response.data?.tones && Array.isArray(response.data.tones)) {
      tones.value = response.data.tones
      console.log('✅ tones.value 설정됨:', tones.value.length, '개')
      console.log('톤 목록:', tones.value.map(t => t.description || t.tone))
    } else {
      console.error('❌ tones 데이터 형식 오류:', response.data)
      alert('톤 데이터 형식이 올바르지 않습니다.')
    }
  } catch (error) {
    console.error('❌ 톤 생성 실패:', error)
    alert('톤 생성에 실패했습니다.')
  } finally {
    loadingTones.value = false
  }
}

// Step 2: 톤 선택 (하위 호환성 - 더 이상 사용하지 않음)
const handleToneSelect = (tone: ToneOption) => {
  selectedTone.value = tone
  // 톤 선택 시 step2 완료 표시
  stepCompleted.value.step2 = true
}

// Step 2: 톤 재생성 (하위 호환성 - 더 이상 사용하지 않음)
const handleRegenerateTones = async () => {
  selectedTone.value = null
  stepCompleted.value.step2 = false
  await loadTones()
}

// Step 3: 디자인 생성 (초안, 스타일 선택, 추가 요청, 이미지 생성)
const handleImageGenerate = async (data: { image: string; prompt: string; style: string; additionalRequest: string; model?: string }) => {
  // designId가 없으면 자동으로 생성
  if (!designId.value) {
    if (!basicInfo.value) {
      alert('기본 정보가 없습니다. 먼저 기본 정보를 입력해주세요.')
      showBasicInfoModal.value = true
      return
    }
    
    try {
      const response = await invitationService.createDesign({
        groom_name: basicInfo.value.groom_name,
        bride_name: basicInfo.value.bride_name,
        groom_father_name: basicInfo.value.groom_father_name,
        groom_mother_name: basicInfo.value.groom_mother_name,
        bride_father_name: basicInfo.value.bride_father_name,
        bride_mother_name: basicInfo.value.bride_mother_name,
        wedding_date: basicInfo.value.wedding_date,
        wedding_time: basicInfo.value.wedding_time,
        wedding_location: basicInfo.value.wedding_location,
        wedding_location_detail: basicInfo.value.wedding_location_detail,
        map_address: basicInfo.value.wedding_location,
        additional_message: basicInfo.value.additional_message,
        design_data: {
          ...basicInfo.value,
          map_lat: basicInfo.value.mapInfo?.lat,
          map_lng: basicInfo.value.mapInfo?.lng
        }
      })
      
      designId.value = response.data.id
      console.log('디자인 자동 생성 성공:', designId.value)
    } catch (error) {
      console.error('디자인 생성 실패:', error)
      alert('디자인 생성에 실패했습니다. 다시 시도해주세요.')
      return
    }
  }
  
  if (!selectedTone.value) {
    alert('톤이 선택되지 않았습니다. 먼저 톤을 선택해주세요.')
    currentStep.value = 2
    return
  }

  designGenerator.value?.setLoading(true)
  designRequirements.value = data.additionalRequest
  
  try {
    // 선택한 모델로 이미지 생성
    const selectedModel = data.model || 'gemini' // 기본값: Gemini 3 Pro Image Preview
    
    // 모델에 따라 model_type 결정 (하위 호환성)
    // Gemini 모델은 pro, 나머지는 free
    const modelType = selectedModel === 'gemini' ? 'pro' : 'free'
    
    const response = await invitationService.generateImage({
      design_id: designId.value!,
      selected_tone: selectedTone.value.tone,
      selected_text: selectedTone.value.main_text,
      prompt: data.prompt,
      model: selectedModel, // 선택한 모델 전달
      model_type: modelType, // 하위 호환성
      base_image_url: data.image || undefined
    })
    
    const imageB64 = response.data.image_b64
    designGenerator.value?.setFinalImage(imageB64)
    generatedImageUrl.value = imageB64
    originalGeneratedImageUrl.value = imageB64 // 원본 이미지 보존
    
    // Step 3 완료 표시 (이미지 생성 완료 시)
    stepCompleted.value.step3 = true
  } catch (error: any) {
    console.error('이미지 생성 실패:', error)
    console.error('에러 상세:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    })
    
    // 더 자세한 에러 메시지 표시
    let errorMessage = '이미지 생성에 실패했습니다.'
    if (error?.response?.data?.detail) {
      errorMessage = `이미지 생성 실패: ${error.response.data.detail}`
    } else if (error?.response?.data?.message) {
      errorMessage = `이미지 생성 실패: ${error.response.data.message}`
    } else if (error?.message) {
      errorMessage = `이미지 생성 실패: ${error.message}`
    }
    
    alert(errorMessage)
  } finally {
    designGenerator.value?.setLoading(false)
  }
}

// Step 3: 다음 단계로 (수정 단계로 이동) - 더 이상 사용 안 함
const handleNextToModify = () => {
  // 이 함수는 더 이상 사용하지 않음 (InvitationDesignStep에서 호출하지 않음)
}

// 스타일 이미지 업로드 핸들러
const styleImagesInput = ref<HTMLInputElement>()
const handleStyleImagesChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length + styleImages.value.length > 3) {
    alert('최대 3장까지 업로드 가능합니다.')
    return
  }
  styleImages.value = [...styleImages.value, ...files.slice(0, 3 - styleImages.value.length)]
}

// getImagePreview 함수는 이미 위에서 선언됨 (705번 라인)

const removeStyleImage = (index: number) => {
  URL.revokeObjectURL(getImagePreview(styleImages.value[index]))
  styleImages.value.splice(index, 1)
}

// getImagePreview 함수는 이미 위에서 선언됨 (705번 라인)

// Step 3: 디자인 생성 (FE 스타일 - /api/invitations/design 사용)
const handleDesignSubmit = async () => {
  if (!selectedTone.value) {
    alert('톤이 선택되지 않았습니다.')
    return
  }

  if (!basicInfo.value) {
    alert('기본 정보가 없습니다.')
    return
  }

  designGenerator.value?.setLoading(true)
  
  try {
    const payload = {
      groom: {
        name: basicInfo.value.groom_name,
        fatherName: basicInfo.value.groom_father_name || '',
        motherName: basicInfo.value.groom_mother_name || ''
      },
      bride: {
        name: basicInfo.value.bride_name,
        fatherName: basicInfo.value.bride_father_name || '',
        motherName: basicInfo.value.bride_mother_name || ''
      },
      wedding: {
        hallName: basicInfo.value.wedding_location || '',
        address: basicInfo.value.wedding_location_detail || '',
        date: basicInfo.value.wedding_date || '',
        time: basicInfo.value.wedding_time || ''
      },
      extraMessage: basicInfo.value.additional_message || '',
      additionalRequest: designRequirements.value || '',
      tone: selectedTone.value.tone
    }

    const formData = new FormData()
    
    // 메인 이미지 추가 (FE 스타일)
    if (mainImage.value) {
      formData.append("weddingImage", mainImage.value)
    }
    
    // 스타일 이미지 추가
    styleImages.value.forEach((f) => formData.append("styleImages", f))
    
    // 데이터 추가
    formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }))

    // FE 스타일 API 호출
    const response = await request<{
      status: string
      result2dImageUrls: string[]
    }>('/invitations/design', {
      method: 'POST',
      body: formData,
    })

    if (!response) {
      throw new Error("디자인 생성 응답이 없습니다.")
    }

    const urls = response.result2dImageUrls || []
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("생성된 청첩장 이미지가 없습니다.")
    }

    // 여러 이미지 저장
    generatedImageUrls.value = urls
    generatedImageUrl.value = urls[0] // 첫 번째 이미지를 기본값으로
    originalGeneratedImageUrl.value = urls[0]

    // Step 4 완료 표시
    stepCompleted.value.step4 = true
    
    // Step 5로 이동 (완료 페이지)
    if (generatedImageUrls.value.length > 0) {
      currentStep.value = 5
      stepCompleted.value.step5 = true
    }
  } catch (error: any) {
    console.error('디자인 생성 실패:', error)
    alert(error?.message || "전송 중 오류가 발생했습니다.")
  } finally {
    designGenerator.value?.setLoading(false)
  }
}

// Step 3: 다음 버튼 클릭 (FE 스타일 디자인 생성)
const handleNextFromDesign = async () => {
  // FE 스타일로 디자인 생성
  await handleDesignSubmit()
}

// Step 4: 커스텀 (이미지 수정)
const handleImageModifyPro = async (data: { 
  image: string
  prompt: string
  textRequirements: string
  model: string
  personImageB64?: string
  styleImagesB64?: string[]
}) => {
  if (!designId.value) {
    alert('디자인 정보가 없습니다.')
    return
  }

  // 하루 5번 제한 확인
  if (remainingCustomCount.value <= 0) {
    alert('하루 사용 횟수(5회)를 모두 사용하셨습니다. 내일 다시 시도해주세요.')
    return
  }

  designModifier.value?.setLoading(true)
  
  try {
    // 선택한 모델로 수정
    const response = await invitationService.modifyImage({
      design_id: designId.value,
      base_image_url: data.image,
      modification_prompt: data.prompt,
      model: data.model, // 선택한 모델 사용
      // 하위 호환성을 위해 model_type도 설정 (model이 있으면 무시됨)
      model_type: data.model === 'gemini' ? 'pro' : 'free',
      person_image_b64: data.personImageB64,
      style_images_b64: data.styleImagesB64
    })
    
    const imageB64 = response.data.image_b64
    designModifier.value?.setGeneratedImage(imageB64)
    // generatedImageUrl은 원본 유지, 수정된 이미지는 InvitationDesignModifier에서 관리
    // generatedImageUrl.value = imageB64  // 원본 유지를 위해 주석 처리
    
    // 사용 횟수 차감
    const today = new Date().toDateString()
    const currentCount = parseInt(localStorage.getItem(`custom_count_${today}`) || '0')
    localStorage.setItem(`custom_count_${today}`, String(currentCount + 1))
    remainingCustomCount.value = Math.max(0, 5 - (currentCount + 1))
    
    // Step 4 완료 표시
    stepCompleted.value.step4 = true
  } catch (error: any) {
    console.error('이미지 수정 실패:', error)
    const errorMessage = error?.response?.data?.detail || '이미지 수정에 실패했습니다.'
    alert(errorMessage)
  } finally {
    designModifier.value?.setLoading(false)
  }
}

// Step 4: 커스텀 건너뛰기
const handleSkipModify = () => {
  if (confirm('커스텀을 건너뛰고 완료하시겠습니까?')) {
    handleImageSave(generatedImageUrl.value)
  }
}

// Step 4/5: 이미지 저장 및 완료
const handleImageSave = async (image: string) => {
  if (!designId.value) {
    alert('디자인 정보가 없습니다. 새로고침 후 다시 시도해주세요.')
    return
  }

  if (!image) {
    alert('저장할 이미지가 없습니다.')
    return
  }

  try {
    console.log('저장 시작:', { designId: designId.value, imageLength: image.length })
    
    // 최종 이미지 URL 저장 (generatedImageUrl 업데이트)
    generatedImageUrl.value = image
    
    await invitationService.updateDesign(designId.value, {
      design_data: {
        ...basicInfo.value,
        generated_image_url: image,
        selected_tone: selectedTone.value?.tone,
        selected_text: selectedTone.value?.main_text,
        design_requirements: designRequirements.value
      },
      status: 'COMPLETED'
    })
    
    console.log('저장 성공!')
    currentStep.value = 5
  } catch (error: any) {
    console.error('저장 실패:', error)
    console.error('에러 상세:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    })
    
    let errorMessage = '저장에 실패했습니다.'
    if (error?.response?.data?.detail) {
      errorMessage = `저장 실패: ${error.response.data.detail}`
    } else if (error?.response?.data?.message) {
      errorMessage = `저장 실패: ${error.response.data.message}`
    } else if (error?.message) {
      errorMessage = `저장 실패: ${error.message}`
    }
    
    alert(errorMessage)
  }
}

// Step 5: 결과 페이지 (FE 스타일)
const currentImageIndex = ref(0)
const startXRef = ref(0)
const draggingRef = ref(false)

// 결과 이미지 목록 (FE 스타일)
const resultImages = computed(() => {
  if (generatedImageUrls.value.length > 0) {
    return generatedImageUrls.value.map((url, idx) => ({
      id: `result-${idx + 1}`,
      title: `청첩장 ${idx + 1}`,
      desc: idx === 0
        ? "STEP2에서 업로드한 웨딩 사진 + 배경 디자인 + 선택한 테두리"
        : "백엔드에서 전달된 최종 이미지",
      src: url,
    }))
  }
  
  // 기본 이미지가 있으면 사용
  if (generatedImageUrl.value) {
    return [{
      id: "result-1",
      title: "청첩장 1",
      desc: "완성된 청첩장",
      src: generatedImageUrl.value,
    }]
  }
  
  // 더미 데이터
  return [
    {
      id: "result-1",
      title: "페이지 1",
      desc: "STEP2에서 업로드한 웨딩 사진 + 배경 디자인 + 선택한 테두리",
      src: "/images/1.png",
    },
    {
      id: "result-2",
      title: "페이지 2",
      desc: "문구/정보가 포함된 청첩장",
      src: "/images/2.png",
    },
    {
      id: "result-3",
      title: "페이지 3",
      desc: "추가 옵션으로 꾸며본 레이아웃 예시",
      src: "/images/3.png",
    },
  ]
})

const clampIndex = (next: number) => Math.max(0, Math.min(resultImages.value.length - 1, next))

const goPrevImage = () => {
  currentImageIndex.value = clampIndex(currentImageIndex.value - 1)
}

const goNextImage = () => {
  currentImageIndex.value = clampIndex(currentImageIndex.value + 1)
}

// 스와이프 핸들러 (FE 스타일)
const onTouchStart = (e: TouchEvent) => {
  draggingRef.value = true
  startXRef.value = e.touches[0].clientX
}

const onTouchEnd = (e: TouchEvent) => {
  if (!draggingRef.value) return
  draggingRef.value = false
  const endX = e.changedTouches[0].clientX
  const dx = endX - startXRef.value

  // threshold: 스와이프 감지 거리
  const TH = 50
  if (dx > TH) goPrevImage()
  if (dx < -TH) goNextImage()
}

// 키보드 네비게이션 (FE 스타일)
const handleViewerKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goPrevImage()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goNextImage()
  }
}

// 모든 이미지 다운로드 (FE 스타일)
const downloadAllImages = () => {
  resultImages.value.forEach((img, i) => {
    setTimeout(() => {
      const a = document.createElement("a")
      a.href = img.src
      a.download = `${img.id}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
    }, i * 250)
  })
}

// 디자인 다시하기
const redoDesign = () => {
  currentStep.value = 3
  generatedImageUrls.value = []
  generatedImageUrl.value = ''
  stepCompleted.value.step3 = false
}

// 이미지 다운로드 함수 (단일 이미지용 - 하위 호환성)
const downloadImage = (format: 'png' | 'jpeg') => {
  if (resultImages.value.length === 0) {
    alert('다운로드할 이미지가 없습니다.')
    return
  }
  
  const currentImage = resultImages.value[currentImageIndex.value]
  if (!currentImage) return
  
  try {
    const imageData = currentImage.src
    const groomName = basicInfo.value?.groom_name || '신랑'
    const brideName = basicInfo.value?.bride_name || '신부'
    const today = new Date().toISOString().split('T')[0]
    const fileName = `${groomName}_${brideName}_청첩장_${currentImageIndex.value + 1}_${today}.${format}`
    
    const link = document.createElement('a')
    
    if (format === 'jpeg' && imageData.includes('image/png')) {
      const canvas = document.createElement('canvas')
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          
          const jpegData = canvas.toDataURL('image/jpeg', 0.95)
          link.href = jpegData
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
      img.src = imageData
    } else {
      link.href = imageData
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('다운로드 실패:', error)
    alert('이미지 다운로드에 실패했습니다. 다시 시도해주세요.')
  }
}

const goToList = () => {
  router.push('/invitation/list')
}

// 3D 청첩장 관련 함수들
const threeDMainImageInput = ref<HTMLInputElement>()
const threeDReferenceImagesInput = ref<HTMLInputElement>()

// 영화 포스터 관련 데이터
const posterImage = ref<File | null>(null) // 포스터 이미지
const posterMainImages = ref<File[]>([]) // 신랑신부 사진 (최대 3장)
const posterCustomText = ref<string>('') // 커스텀 문구
const posterStatus = ref<'IDLE' | 'PROCESSING' | 'DONE' | 'FAILED'>('IDLE')
const posterError = ref<string | null>(null)
const posterResultUrl = ref<string | null>(null)
const posterImageInput = ref<HTMLInputElement>()
const posterMainImagesInput = ref<HTMLInputElement>()

const handleThreeDMainImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    threeDMainImage.value = file
  }
}

const removeThreeDMainImage = () => {
  if (threeDMainImage.value) {
    URL.revokeObjectURL(getImagePreview(threeDMainImage.value))
    threeDMainImage.value = null
  }
}

const handleThreeDReferenceImagesChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length + threeDReferenceImages.value.length > 2) {
    alert('최대 2장까지 업로드 가능합니다.')
    return
  }
  threeDReferenceImages.value = [...threeDReferenceImages.value, ...files.slice(0, 2 - threeDReferenceImages.value.length)]
}

const removeThreeDReferenceImage = (index: number) => {
  URL.revokeObjectURL(getImagePreview(threeDReferenceImages.value[index]))
  threeDReferenceImages.value.splice(index, 1)
}

// 3D 청첩장 생성 시작
const handleThreeDSubmit = async () => {
  if (!threeDMainImage.value) {
    alert('메인 사진을 업로드해주세요.')
    return
  }

  if (threeDReferenceImages.value.length > 2) {
    alert('레퍼런스 사진은 최대 2장까지 가능합니다.')
    return
  }

  threeDStatus.value = 'SUBMITTED'
  threeDError.value = null

  try {
    const formData = new FormData()
    formData.append('mainImage', threeDMainImage.value)
    threeDReferenceImages.value.forEach((f) => formData.append('optionalImages', f))

    const response = await request<{
      status: string
      invitationId?: number
      result2dImageUrls?: string[]
      assets?: {
        model3dUrl?: string
      }
      message?: string
    }>('/invitations/3d', {
      method: 'POST',
      body: formData,
    })

    if (response.result2dImageUrls && response.result2dImageUrls.length > 0) {
      threeDResultImageUrls.value = response.result2dImageUrls
      if (response.assets?.model3dUrl) {
        threeDModelUrl.value = response.assets.model3dUrl
      }
    }

    threeDInvitationId.value = response.invitationId || null
    threeDStatus.value = 'PENDING'

    // 폴링 시작
    startThreeDPolling()
  } catch (error: any) {
    console.error('3D 청첩장 생성 요청 실패:', error)
    threeDStatus.value = 'FAILED'
    threeDError.value = error?.message || '3D 청첩장 생성 요청에 실패했습니다.'
  }
}

// 3D 상태 폴링
const startThreeDPolling = async () => {
  const pollInterval = 5000 // 5초마다 확인

  const pollOnce = async () => {
    if (!threeDInvitationId.value) {
      stopThreeDPolling()
      return
    }

    try {
      const response = await request<{
        status: string
        invitationId?: number
        result2dImageUrls?: string[]
        assets?: {
          model3dUrl?: string
        }
        message?: string
      }>('/invitations/3d/status', {
        method: 'GET',
      })

      const status = String(response.status || '').toUpperCase()

      if (status === 'COMPLETED' || status === 'DONE' || status === 'SUCCESS') {
        threeDStatus.value = 'DONE'
        if (response.result2dImageUrls) {
          threeDResultImageUrls.value = response.result2dImageUrls
        }
        if (response.assets?.model3dUrl) {
          threeDModelUrl.value = response.assets.model3dUrl
        }
        stopThreeDPolling()
        stepCompleted.value.step7 = true
        alert('3D 청첩장이 완성되었습니다!')
        // 완료 후 특별 기능 선택 화면으로 돌아가기
        setTimeout(() => {
          currentStep.value = 6
        }, 1000)
        return
      }

      if (status.includes('FAILED') || status.includes('ERROR')) {
        threeDStatus.value = 'FAILED'
        threeDError.value = response.message || '3D 청첩장 생성에 실패했습니다.'
        stopThreeDPolling()
        return
      }

      // 진행 중
      threeDStatus.value = 'RUNNING'
      if (response.result2dImageUrls) {
        threeDResultImageUrls.value = response.result2dImageUrls
      }
      if (response.assets?.model3dUrl) {
        threeDModelUrl.value = response.assets.model3dUrl
      }

      // 다음 폴링 예약
      threeDPollingTimer.value = window.setTimeout(pollOnce, pollInterval)
    } catch (error: any) {
      console.error('3D 상태 확인 실패:', error)
      // 네트워크 오류인 경우 재시도
      threeDPollingTimer.value = window.setTimeout(pollOnce, pollInterval)
    }
  }

  // 첫 폴링 시작
  threeDPollingTimer.value = window.setTimeout(pollOnce, pollInterval)
}

// 3D 폴링 중지
const stopThreeDPolling = () => {
  if (threeDPollingTimer.value) {
    clearTimeout(threeDPollingTimer.value)
    threeDPollingTimer.value = null
  }
  if (threeDStatus.value === 'SUBMITTED' || threeDStatus.value === 'PENDING' || threeDStatus.value === 'RUNNING') {
    threeDStatus.value = 'CANCELED'
    threeDError.value = '사용자에 의해 취소되었습니다.'
  }
}

// 컴포넌트 언마운트 시 폴링 정리
onUnmounted(() => {
  stopThreeDPolling()
})

// 영화 포스터 관련 함수들
const handlePosterImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    posterImage.value = file
  }
}

const removePosterImage = () => {
  if (posterImage.value) {
    URL.revokeObjectURL(getImagePreview(posterImage.value))
    posterImage.value = null
  }
}

const handlePosterMainImagesChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length === 0) return

  // 최대 3장 제한
  if (files.length + posterMainImages.value.length > 3) {
    alert('최대 3장까지만 업로드할 수 있습니다.')
    return
  }

  posterMainImages.value = [...posterMainImages.value, ...files.slice(0, 3 - posterMainImages.value.length)]
}

const removePosterMainImage = (index: number) => {
  if (posterMainImages.value[index]) {
    URL.revokeObjectURL(getImagePreview(posterMainImages.value[index]))
    posterMainImages.value.splice(index, 1)
  }
}

const handlePosterSubmit = async () => {
  if (!posterImage.value || posterMainImages.value.length === 0) {
    alert('포스터 이미지와 신랑신부 사진을 업로드해주세요.')
    return
  }

  posterStatus.value = 'PROCESSING'
  posterError.value = null
  posterResultUrl.value = null

  try {
    const formData = new FormData()
    formData.append('posterImage', posterImage.value)
    posterMainImages.value.forEach((file) => {
      formData.append('mainImages', file)
    })
    if (posterCustomText.value.trim()) {
      formData.append('customText', posterCustomText.value.trim())
    }

    const response = await request<{
      message: string
      data: {
        resultImageUrl: string
      }
    }>('/invitations/poster', {
      method: 'POST',
      body: formData,
    })

    if (response.data?.resultImageUrl) {
      posterResultUrl.value = response.data.resultImageUrl
      posterStatus.value = 'DONE'
      stepCompleted.value.step7 = true
      alert('영화 포스터가 완성되었습니다!')
      // 완료 후 특별 기능 선택 화면으로 돌아가기
      setTimeout(() => {
        currentStep.value = 6
      }, 1000)
    } else {
      throw new Error('포스터 생성에 실패했습니다.')
    }
  } catch (error: any) {
    console.error('영화 포스터 생성 실패:', error)
    posterStatus.value = 'FAILED'
    posterError.value = error?.data?.error || error?.message || '영화 포스터 생성에 실패했습니다.'
  }
}

const downloadPoster = () => {
  if (!posterResultUrl.value) return
  
  const link = document.createElement('a')
  link.href = posterResultUrl.value
  link.download = `영화포스터_${basicInfo.value?.groom_name || '신랑'}_${basicInfo.value?.bride_name || '신부'}_${new Date().toISOString().split('T')[0]}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const sharePoster = async () => {
  if (!posterResultUrl.value) return
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: '우리의 영화 포스터',
        text: '특별한 영화 포스터를 만들어봤어요!',
        url: posterResultUrl.value,
      })
    } catch (err) {
      console.error('공유 실패:', err)
    }
  } else {
    // 공유 API가 없는 경우 클립보드에 복사
    try {
      await navigator.clipboard.writeText(posterResultUrl.value)
      alert('포스터 URL이 클립보드에 복사되었습니다!')
    } catch (err) {
      console.error('클립보드 복사 실패:', err)
    }
  }
}

// 특별한 기능 선택 핸들러
const handleSelectOption = (option: '3d' | 'poster') => {
  if (option === '3d') {
    currentStep.value = 7 // 3D 청첩장 단계로 이동
    stepCompleted.value.step6 = true
  } else if (option === 'poster') {
    currentStep.value = 8 // 영화 포스터 단계로 이동
    stepCompleted.value.step6 = true
  }
}

const createNew = () => {
  currentStep.value = 1
  requirements.value = ''
  tones.value = []
  selectedTone.value = null
  generatedImageUrl.value = ''
  generatedImageUrls.value = []
  originalGeneratedImageUrl.value = '' // 원본 이미지도 초기화
  designRequirements.value = ''
  designId.value = undefined
  styleImages.value = []
  mainImage.value = null
  currentImageIndex.value = 0
  
  // 3D 관련 초기화
  threeDMainImage.value = null
  threeDReferenceImages.value = []
  threeDStatus.value = 'IDLE'
  threeDInvitationId.value = null
  threeDModelUrl.value = ''
  threeDResultImageUrls.value = []
  threeDError.value = null
  stopThreeDPolling()
  
  // 영화 포스터 관련 초기화
  posterImage.value = null
  posterMainImages.value = []
  posterCustomText.value = ''
  posterStatus.value = 'IDLE'
  posterError.value = null
  posterResultUrl.value = null
  
  // 특별 기능 선택 초기화
  selectedSpecialFeature.value = null
  
  // 모든 단계 완료 상태 초기화 (기본 정보는 유지)
  stepCompleted.value = {
    step0: stepCompleted.value.step0, // 기본 정보는 유지
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
    step7: false
  }
}
</script>

<style scoped>
.invitation-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.workflow-description {
  text-align: center;
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.info-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.info-banner p {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.open-modal-btn {
  padding: 0.75rem 2rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.open-modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.progress-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.4;
  transition: opacity 0.3s;
}

.progress-step.active,
.progress-step.completed {
  opacity: 1;
}

.step-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  color: #6c757d;
  transition: all 0.3s;
}

.progress-step.active .step-circle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.progress-step.completed .step-circle {
  background: #28a745;
  color: white;
}

.progress-step.locked {
  opacity: 0.3;
  cursor: not-allowed;
}

.progress-step.locked .step-circle {
  background: #dee2e6;
  color: #adb5bd;
}

.progress-step:not(.locked) {
  cursor: pointer;
}

.progress-step:not(.locked):hover {
  opacity: 0.8;
}

.step-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.step-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6c757d;
  text-align: center;
}

.step-description-small {
  font-size: 0.75rem;
  color: #adb5bd;
  text-align: center;
  max-width: 120px;
}

.progress-step.active .step-label {
  color: #667eea;
}

.progress-step.active .step-description-small {
  color: #667eea;
}

.access-denied {
  text-align: center;
  padding: 3rem 2rem;
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 12px;
  margin: 2rem 0;
}

.access-denied p {
  font-size: 1.2rem;
  color: #856404;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.access-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.step-description {
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.6;
}

.pro-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.step-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.back-btn,
.next-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn {
  background: #6c757d;
  color: white;
}

.back-btn:hover {
  background: #5a6268;
  transform: translateX(-2px);
}

.next-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.next-btn:hover:not(:disabled) {
  transform: translateX(2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.next-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.completion {
  text-align: center;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.success-message h2 {
  font-size: 2rem;
  color: #28a745;
  margin-bottom: 0.5rem;
}

.success-subtitle {
  color: #6c757d;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

/* 완성된 이미지 미리보기 */
.final-image-preview {
  margin: 1.5rem auto;
  max-width: 500px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.final-image-preview img {
  width: 100%;
  display: block;
}

/* 다운로드 섹션 */
.download-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
}

.download-section h3 {
  font-size: 1.3rem;
  color: #495057;
  margin-bottom: 0.5rem;
}

.download-hint {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.download-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.download-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 180px;
}

.download-btn.png {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.download-btn.png:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.download-btn.jpeg {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.download-btn.jpeg:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.6);
}

.completion-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #dee2e6;
}

.list-btn,
.new-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 150px;
}

.list-btn {
  background: #28a745;
  color: white;
}

.list-btn:hover {
  background: #218838;
  transform: translateY(-2px);
}

.new-btn {
  background: #6c757d;
  color: white;
}

.view-btn:hover,
.list-btn:hover,
.new-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .progress-bar {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .step-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  /* 완료 화면 반응형 */
  .completion {
    padding: 1rem;
  }
  
  .success-message h2 {
    font-size: 1.5rem;
  }
  
  .final-image-preview {
    max-width: 100%;
    border-radius: 12px;
  }
  
  .download-section {
    padding: 1rem;
  }
  
  .download-buttons {
    flex-direction: column;
  }
  
  .download-btn {
    width: 100%;
    min-width: auto;
  }
  
  .completion-actions {
    flex-direction: column;
  }
  
  .list-btn,
  .new-btn {
    width: 100%;
    min-width: auto;
  }
}

/* 작은 모바일 */
@media (max-width: 480px) {
  .success-message h2 {
    font-size: 1.3rem;
  }
  
  .success-subtitle {
    font-size: 0.95rem;
  }
  
  .download-section h3 {
    font-size: 1.1rem;
  }
}

/* Step 2: 톤 선택 그리드 (FE 스타일) */
.tone-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.tone-selection-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tone-selection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.tone-selection-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
}

.tone-selection-card.selected::after {
  content: '';
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tone-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.tone-icon {
  font-size: 2rem;
}

.tone-card-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.tone-check {
  font-size: 1.5rem;
  color: #667eea;
  font-weight: 700;
}

.tone-description {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0.5rem 0;
  line-height: 1.5;
}

.tone-example {
  font-size: 0.95rem;
  color: #495057;
  margin: 0.75rem 0 0;
  font-style: italic;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Step 3: 스타일 이미지 업로드 섹션 */
.style-images-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.style-images-section h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.style-images-desc {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.style-images-uploader {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.style-images-input {
  display: none;
}

.upload-area {
  width: 100%;
  min-height: 200px;
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  margin-bottom: 1rem;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 3rem;
  color: #667eea;
  font-weight: 300;
  line-height: 1;
}

.upload-text {
  font-size: 1rem;
  color: #495057;
  font-weight: 500;
}

.upload-count {
  font-size: 0.85rem;
  color: #6c757d;
}

.style-images-preview {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.style-image-item {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-number {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(102, 126, 234, 0.9);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 2;
}

.style-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-style-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
}

.upload-style-images-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-style-images-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.upload-style-images-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #6c757d;
}

.style-images-hint {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

/* Step 5: 결과 페이지 (FE 스타일) */
.result-page {
  max-width: 980px;
  margin: 0 auto;
}

.result-header {
  text-align: center;
  margin-bottom: 2rem;
}

.result-header h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.result-hint {
  font-size: 0.95rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.viewer-card {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 22px;
  background: rgba(255, 235, 242, 0.8);
  border: 1px solid rgba(255, 170, 190, 0.35);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.viewer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
}

.viewer-badge {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.9rem;
  color: #cf2d71;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 170, 190, 0.35);
}

.viewer-counter {
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.85rem;
  color: #2a2f3a;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 170, 190, 0.35);
}

.viewer {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 240, 245, 0.55);
  border: 1px solid rgba(255, 170, 190, 0.18);
  margin-top: 0.5rem;
  min-height: 400px;
  outline: none;
}

.viewer:focus {
  border-color: rgba(255, 170, 190, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 170, 190, 0.2);
}

.viewer-track {
  display: flex;
  width: 100%;
  transition: transform 260ms ease;
  will-change: transform;
}

.viewer-slide {
  min-width: 100%;
  padding: 1.5rem 1rem 1rem;
  display: grid;
  gap: 1rem;
  align-content: start;
}

.viewer-poster {
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 170, 190, 0.22);
  box-shadow: 0 16px 40px rgba(30, 30, 40, 0.08);
  width: 50%;
  margin: 0 auto;
}

.viewer-img {
  width: 100%;
  height: auto;
  display: block;
}

.viewer-meta {
  text-align: center;
  padding: 0.5rem 0.25rem 0.5rem;
}

.viewer-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.5rem 0 0.5rem;
  color: #20242c;
}

.viewer-desc {
  font-size: 0.9rem;
  color: #3c4250;
  margin: 0 0 0.75rem;
}

.viewer-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255, 170, 190, 0.22);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 12px 26px rgba(30, 30, 40, 0.10);
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: auto;
}

.viewer-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.viewer-arrow.left {
  left: 10px;
}

.viewer-arrow.right {
  right: 10px;
}

.viewer-dots {
  display: flex;
  justify-content: center;
  gap: 0.625rem;
  padding: 1rem 0 0.5rem;
}

.viewer-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 0;
  background: rgba(80, 90, 110, 0.25);
  cursor: pointer;
  transition: all 0.3s;
}

.viewer-dot.active {
  width: 38px;
  background: rgba(196, 55, 108, 0.85);
}

.result-actions {
  margin-top: 1.5rem;
  display: grid;
  gap: 0.75rem;
}

.result-btn {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  border: 2px solid transparent;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 180ms ease, filter 180ms ease;
}

.result-btn.primary {
  color: #fff;
  background: linear-gradient(135deg, #fb7185 0%, #f97316 65%, #f59e0b 100%);
  box-shadow: 0 18px 50px rgba(249, 115, 22, 0.25);
}

.result-btn.outline {
  color: #f95085;
  background: #fff;
  border-image: linear-gradient(135deg, #fb7185, #f97316, #f59e0b) 1;
  box-shadow: 0 12px 34px rgba(249, 115, 22, 0.1);
}

.result-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.02);
}

/* 태블릿 이상: 화살표 노출 */
@media (min-width: 900px) {
  .viewer-arrow {
    display: flex;
  }
  .viewer-slide {
    padding: 1.5rem 1.25rem 1.25rem;
  }
}

/* 모바일 최적화 */
@media (max-width: 420px) {
  .viewer-card {
    padding: 1rem 0.875rem 0.875rem;
  }
  .result-header h2 {
    font-size: 1.5rem;
  }
  .viewer-poster {
    width: 80%;
  }
}

/* 메인 이미지 업로드 섹션 */
.image-upload-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.upload-area {
  width: 100%;
  min-height: 200px;
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  margin-bottom: 1rem;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.upload-icon {
  font-size: 3rem;
  color: #667eea;
}

.upload-text {
  font-size: 1rem;
  color: #495057;
  font-weight: 500;
}

.upload-hint {
  font-size: 0.85rem;
  color: #6c757d;
}

.upload-count {
  font-size: 0.85rem;
  color: #6c757d;
}

.image-preview-container {
  margin-top: 1rem;
}

.image-preview {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  transition: all 0.3s;
}

.remove-image-btn:hover {
  background: rgba(239, 68, 68, 1);
  transform: scale(1.1);
}

/* 3D 청첩장 스타일 */
.threed-step {
  padding: 2rem;
}

.threed-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.req {
  color: #ef4444;
}

.pill-ok {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #28a745;
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.hint-text {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.5rem;
}

.reference-images-preview {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.reference-image-item {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-number {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(102, 126, 234, 0.9);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 2;
}

.reference-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.threed-status {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.status-pill {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.status-submitted {
  background: #e7f3ff;
  color: #0066cc;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-running {
  background: #d1ecf1;
  color: #0c5460;
}

.status-done {
  background: #d4edda;
  color: #155724;
}

.status-failed {
  background: #f8d7da;
  color: #721c24;
}

.status-canceled {
  background: #e2e3e5;
  color: #383d41;
}

.error-message {
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.notice {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  color: #856404;
  font-size: 0.9rem;
}

.danger-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: #ef4444;
  color: white;
}

.danger-btn:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

.threed-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.threed-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
}

.status-processing {
  background: #d1ecf1;
  color: #0c5460;
}

.status-canceled {
  background: #e2e3e5;
  color: #383d41;
}

/* 특별한 기능 선택 스타일 (FE OptionSelectPage 스타일) */
.options-step {
  padding: 2rem;
}

.options-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  margin-top: 1.5rem;
}

@media (min-width: 768px) {
  .options-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.option-card {
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.07);
  transition: transform 160ms ease, box-shadow 160ms ease;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  min-height: 320px;
}

.option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 65px rgba(0, 0, 0, 0.1);
}

.option-top {
  padding: 22px 22px 16px;
  color: #fff;
}

.option-card.blue .option-top {
  background: linear-gradient(135deg, #fb7185 0%, #f97316 65%, #f59e0b 100%);
}

.option-card.purple .option-top {
  background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 65%, #7c3aed 100%);
}

.option-icon {
  font-size: 34px;
  filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.15));
  margin-bottom: 10px;
}

.option-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.option-desc {
  margin: 0;
  padding: 16px 22px 0;
  color: rgba(31, 41, 55, 0.78);
  font-weight: 700;
  line-height: 1.55;
}

.option-bullets {
  margin: 12px 0 0;
  padding: 0 22px 18px;
  list-style: none;
  display: grid;
  gap: 10px;
  color: rgba(31, 41, 55, 0.75);
  font-weight: 650;
}

.option-bullets li {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 10px;
  align-items: start;
}

.option-bullets li::before {
  content: "•";
  color: rgba(34, 197, 94, 0.95);
  font-size: 20px;
  line-height: 1;
  margin-top: -2px;
}

.option-btn {
  margin: 0 22px 22px;
  height: 52px;
  border-radius: 16px;
  border: 2px solid transparent;
  background: #fff;
  color: #f63f73;
  cursor: pointer;
  font-weight: 900;
  font-size: 16px;
  transition: transform 120ms ease, filter 120ms ease;
  border-image: linear-gradient(135deg, #fb7185, #f97316, #f59e0b) 1;
}

.option-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}

.option-btn:active {
  transform: translateY(0);
}

.tip-box {
  margin-top: 1.5rem;
  border-radius: 18px;
  border: 1px solid rgba(147, 197, 253, 0.65);
  background: rgba(219, 234, 254, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 18px;
}

.tip-title {
  font-weight: 900;
  color: rgba(30, 64, 175, 0.9);
  margin-bottom: 10px;
}

.tip-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(30, 58, 138, 0.85);
  font-weight: 650;
  line-height: 1.7;
  display: grid;
  gap: 6px;
}

.completed-features {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(212, 237, 218, 0.3);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
}

.completed-badge {
  font-weight: 700;
  color: #16a34a;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.completed-hint {
  margin: 0;
  color: rgba(22, 163, 74, 0.8);
  font-size: 0.9rem;
  font-weight: 600;
}

/* 영화 포스터 스타일 */
.poster-step {
  padding: 2rem;
}

.poster-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.custom-text-input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-top: 0.5rem;
}

.poster-status {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.poster-result {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.poster-result h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.result-image-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto 1rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.result-image-container img {
  width: 100%;
  height: auto;
  display: block;
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.download-btn,
.share-btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.share-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.download-btn:hover,
.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.options-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.options-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}
</style>

