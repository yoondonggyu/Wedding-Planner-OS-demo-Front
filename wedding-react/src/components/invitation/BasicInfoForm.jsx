import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./BasicInfoForm.module.css";
import { useInvitation } from "@/contexts/InvitationContext";
import { useNavigate, useLocation } from "react-router-dom";
import { STEPS } from "@/pages/invitation/router";
import { invitationService } from "@/services/invitationService";

export function BasicInfoForm() {
  const { data, updateField } = useInvitation();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(() => ({
    groomName: data.groom.name || "",
    brideName: data.bride.name || "",
    groomFatherName: data.groom.fatherName || "",
    groomMotherName: data.groom.motherName || "",
    brideFatherName: data.bride.fatherName || "",
    brideMotherName: data.bride.motherName || "",
    venueName: data.wedding.hallName || "",
    venueAddress: data.wedding.address || "",
    venueAddressDetail: "", // 상세 주소
    weddingDate: data.wedding.date || "",
    weddingTime: data.wedding.time || "",
    parkingInfo: data.extraMessage || "",
    additionalInfo: data.additionalRequest || "",
  }));

  // 시간 관련 상태
  const [timeHour, setTimeHour] = useState("");
  const [timeMinute, setTimeMinute] = useState("");
  const [timePeriod, setTimePeriod] = useState("AM");
  const [mapInfo, setMapInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // 시간 조합하여 form에 반영
  useEffect(() => {
    if (timeHour && timeMinute) {
      let hour = parseInt(timeHour, 10);
      if (timePeriod === "PM" && hour < 12) {
        hour += 12;
      } else if (timePeriod === "AM" && hour === 12) {
        hour = 0;
      }
      const formattedTime = `${String(hour).padStart(2, "0")}:${timeMinute.padStart(2, "0")}`;
      setForm((prev) => ({ ...prev, weddingTime: formattedTime }));
    }
  }, [timeHour, timeMinute, timePeriod]);

  // 저장된 시간 파싱
  useEffect(() => {
    if (form.weddingTime) {
      const match = form.weddingTime.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        let hour = parseInt(match[1], 10);
        const minute = match[2];
        if (hour >= 12) {
          setTimePeriod("PM");
          if (hour > 12) hour -= 12;
        } else {
          setTimePeriod("AM");
          if (hour === 0) hour = 12;
        }
        setTimeHour(String(hour));
        setTimeMinute(minute);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 날짜 입력 관련 함수들
  const formatDateValue = (digits) => {
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 6) {
      return digits.slice(0, 4) + "-" + digits.slice(4, 6);
    } else {
      return digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6, 8);
    }
  };

  const handleDateKeydown = (e) => {
    const input = e.target;
    const key = e.key;

    if (
      (key >= "0" && key <= "9") ||
      key === "Backspace" ||
      key === "Delete" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Tab" ||
      key === "Enter"
    ) {
      if (key >= "0" && key <= "9") {
        e.preventDefault();
        const digits = input.value.replace(/\D/g, "") + key;
        const formatted = formatDateValue(digits.slice(0, 8));
        setForm((prev) => ({ ...prev, weddingDate: formatted }));
        setTimeout(() => {
          input.value = formatted;
          input.setSelectionRange(formatted.length, formatted.length);
        }, 0);
      }
      return;
    }
    e.preventDefault();
  };

  const handleDateInput = (e) => {
    const input = e.target;
    const value = input.value;

    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setForm((prev) => ({ ...prev, weddingDate: value }));
      return;
    }

    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = formatDateValue(digits);
    setForm((prev) => ({ ...prev, weddingDate: formatted }));

    setTimeout(() => {
      if (input.value !== formatted) {
        input.value = formatted;
      }
    }, 0);
  };

  const handleDatePaste = (e) => {
    e.preventDefault();
    const input = e.target;
    const pastedText = e.clipboardData?.getData("text") || "";
    const digits = pastedText.replace(/\D/g, "").slice(0, 8);
    const formatted = formatDateValue(digits);

    setForm((prev) => ({ ...prev, weddingDate: formatted }));

    setTimeout(() => {
      input.value = formatted;
      input.setSelectionRange(formatted.length, formatted.length);
    }, 0);
  };

  // 시간 입력 관련 함수들
  const handleHourInput = (e) => {
    const input = e.target;
    const value = input.value.replace(/\D/g, "");

    if (value.length > 2) {
      setTimeHour(value.slice(0, 2));
    } else {
      setTimeHour(value);
    }

    const hourNum = parseInt(value, 10);
    if (!isNaN(hourNum)) {
      if (hourNum >= 13 && hourNum <= 23) {
        setTimePeriod("PM");
        setTimeHour(String(hourNum - 12));
      } else if (hourNum === 0) {
        setTimePeriod("AM");
        setTimeHour("12");
      } else if (hourNum > 23) {
        setTimeHour("12");
      } else if (hourNum > 12) {
        setTimeHour("12");
      }
    }
  };

  const handleMinuteInput = (e) => {
    const input = e.target;
    const value = input.value.replace(/\D/g, "");

    if (value.length > 2) {
      setTimeMinute(value.slice(0, 2));
    } else {
      setTimeMinute(value);
    }

    const minuteNum = parseInt(value, 10);
    if (!isNaN(minuteNum) && minuteNum > 59) {
      setTimeMinute("59");
    }
  };

  // Kakao Maps 주소 검색
  const searchLocation = async () => {
    if (!form.venueAddress) {
      alert("주소를 입력해주세요.");
      return;
    }

    setLoading(true);

    // 카카오 지도 서비스 사용
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(form.venueAddress, (result, status) => {
        setLoading(false);

        if (status === window.kakao.maps.services.Status.OK) {
          const coords = result[0];
          const newMapInfo = {
            lat: parseFloat(coords.y),
            lng: parseFloat(coords.x),
            formatted_address: coords.address_name || form.venueAddress,
          };
          setMapInfo(newMapInfo);

          // 지도 표시
          setTimeout(() => {
            displayKakaoMap(newMapInfo.lat, newMapInfo.lng);
          }, 0);
        } else {
          alert("주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.");
        }
      });
    } else {
      // 카카오 SDK가 로드되지 않은 경우 백엔드 API 사용
      try {
        const response = await invitationService.getMapInfo(form.venueAddress);
        setMapInfo(response.data);
      } catch (error) {
        console.error("지도 정보 조회 실패:", error);
        alert("지도 정보를 가져오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 카카오 지도 표시 함수
  const displayKakaoMap = (lat, lng) => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer || !window.kakao || !window.kakao.maps) return;

    // 기존 지도 제거
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }

    const mapOption = {
      center: new window.kakao.maps.LatLng(lat, lng),
      level: 3,
    };

    const map = new window.kakao.maps.Map(mapContainer, mapOption);
    mapInstanceRef.current = map;

    // 마커 추가
    const markerPosition = new window.kakao.maps.LatLng(lat, lng);
    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
    });
    marker.setMap(map);

    // 인포윈도우 추가
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px;font-size:12px;">${form.venueAddress}</div>`,
    });
    infowindow.open(map, marker);
  };

  const isValid = useMemo(() => {
    const required = [
      "groomName",
      "brideName",
      "groomFatherName",
      "groomMotherName",
      "brideFatherName",
      "brideMotherName",
      "venueName",
      "venueAddress",
      "weddingDate",
      "weddingTime",
    ];
    return required.every((k) => String(form[k] ?? "").trim() !== "");
  }, [form]);

  const handleSubmit = (e) => {
    e.preventDefault();

    updateField("groom.name", form.groomName);
    updateField("groom.fatherName", form.groomFatherName);
    updateField("groom.motherName", form.groomMotherName);

    updateField("bride.name", form.brideName);
    updateField("bride.fatherName", form.brideFatherName);
    updateField("bride.motherName", form.brideMotherName);

    updateField("wedding.hallName", form.venueName);
    updateField("wedding.address", form.venueAddress);
    updateField("wedding.date", form.weddingDate);
    updateField("wedding.time", form.weddingTime);

    updateField("extraMessage", form.parkingInfo);
    updateField("additionalRequest", form.additionalInfo);

    // 지도 정보도 저장 (나중에 사용할 수 있도록)
    if (mapInfo) {
      updateField("wedding.mapInfo", mapInfo);
    }

    // 절대 경로로 이동 (중첩 라우팅에서 상대 경로 문제 해결)
    navigate(`/invitation-design/${STEPS.image.path}`);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid2}>
        <div>
          <label className={styles.labelLg}>
            신랑 이름 <span className={styles.req}>*</span>
          </label>
          <input
            type="text"
            name="groomName"
            placeholder="홍길동"
            className={styles.input}
            value={form.groomName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className={styles.labelLg}>
            신부 이름 <span className={styles.req}>*</span>
          </label>
          <input
            type="text"
            name="brideName"
            placeholder="김영희"
            className={styles.input}
            value={form.brideName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* 신랑 부모님 */}
      <div>
        <h3 className={styles.sectionTitle}>
          신랑 부모님 성함 <span className={styles.req}>*</span>
        </h3>

        <div className={styles.grid2}>
          <div>
            <label className={styles.labelBase}>
              아버지 <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              name="groomFatherName"
              placeholder="홍아무개"
              className={styles.input}
              value={form.groomFatherName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={styles.labelBase}>
              어머니 <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              name="groomMotherName"
              placeholder="김아무개"
              className={styles.input}
              value={form.groomMotherName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* 신부 부모님 */}
      <div>
        <h3 className={styles.sectionTitle}>
          신부 부모님 성함 <span className={styles.req}>*</span>
        </h3>

        <div className={styles.grid2}>
          <div>
            <label className={styles.labelBase}>
              아버지 <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              name="brideFatherName"
              placeholder="김아무개"
              className={styles.input}
              value={form.brideFatherName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={styles.labelBase}>
              어머니 <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              name="brideMotherName"
              placeholder="이아무개"
              className={styles.input}
              value={form.brideMotherName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* 예식장 정보 */}
      <div>
        <h3 className={styles.sectionTitle}>
          예식장 정보 <span className={styles.req}>*</span>
        </h3>

        <div className={styles.stack6}>
          <div>
            <label className={styles.labelBase}>
              예식장 이름 <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              name="venueName"
              placeholder="○○웨딩홀"
              className={styles.input}
              value={form.venueName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={styles.labelBase}>
              예식장 주소 <span className={styles.req}>*</span>
            </label>
            <div className={styles.locationInputGroup}>
              <input
                type="text"
                name="venueAddress"
                placeholder="서울특별시 강남구..."
                className={styles.input}
                value={form.venueAddress}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className={styles.searchBtn}
                onClick={searchLocation}
                disabled={loading}
              >
                {loading ? "검색 중..." : "🔍 지도 검색"}
              </button>
            </div>
          </div>

          <div>
            <label className={styles.labelBase}>상세 주소</label>
            <input
              type="text"
              name="venueAddressDetail"
              placeholder="그랜드볼룸 3층"
              className={styles.input}
              value={form.venueAddressDetail}
              onChange={handleChange}
            />
          </div>

          {/* 지도 정보 표시 */}
          {mapInfo && (
            <div className={styles.mapInfo}>
              <p>
                <strong>📍 위치:</strong> {mapInfo.formatted_address}
              </p>
              <p>
                <strong>🗺️ 좌표:</strong> {mapInfo.lat.toFixed(6)}, {mapInfo.lng.toFixed(6)}
              </p>
              {/* 카카오 지도 표시 영역 */}
              <div id="kakao-map" ref={mapContainerRef} className={styles.kakaoMapContainer}></div>
              {/* 지도 링크 */}
              <div className={styles.mapLinks}>
                <a
                  href={`https://map.kakao.com/link/map/${mapInfo.formatted_address},${mapInfo.lat},${mapInfo.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapLink}
                >
                  🗺️ 카카오맵에서 보기
                </a>
                <a
                  href={`https://map.kakao.com/link/to/${mapInfo.formatted_address},${mapInfo.lat},${mapInfo.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapLink}
                >
                  🚗 길찾기
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 예식 일시 */}
      <div>
        <h3 className={styles.sectionTitle}>
          예식 일시 <span className={styles.req}>*</span>
        </h3>

        <div className={styles.grid2}>
          <div>
            <label className={styles.labelBase}>
              예식 날짜 <span className={styles.req}>*</span>
            </label>
            <div className={styles.dateInputWrapper}>
              <input
                type="text"
                name="weddingDate"
                placeholder="YYYY-MM-DD"
                maxLength={10}
                className={styles.input}
                value={form.weddingDate}
                onKeyDown={handleDateKeydown}
                onInput={handleDateInput}
                onPaste={handleDatePaste}
                required
              />
              <span className={styles.inputIcon}>📅</span>
            </div>
          </div>

          <div>
            <label className={styles.labelBase}>
              예식 시간 <span className={styles.req}>*</span>
            </label>
            <div className={styles.timeInputWrapper}>
              <input
                type="text"
                placeholder="시"
                maxLength={2}
                className={styles.timeInput}
                value={timeHour}
                onInput={handleHourInput}
                required
              />
              <span className={styles.timeSeparator}>:</span>
              <input
                type="text"
                placeholder="분"
                maxLength={2}
                className={styles.timeInput}
                value={timeMinute}
                onInput={handleMinuteInput}
                required
              />
              <button
                type="button"
                className={`${styles.periodBtn} ${timePeriod === "AM" ? styles.active : ""}`}
                onClick={() => setTimePeriod("AM")}
              >
                오전
              </button>
              <button
                type="button"
                className={`${styles.periodBtn} ${timePeriod === "PM" ? styles.active : ""}`}
                onClick={() => setTimePeriod("PM")}
              >
                오후
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}>
        <h3 className={styles.dividerTitle}>
          추가 정보 <span className={styles.dividerHint}>(선택)</span>
        </h3>
        <p className={styles.dividerDesc}>선택사항이며 입력하지 않아도 됩니다</p>
      </div>

      {/* 주차/추가문구 */}
      <div>
        <label className={styles.labelBase}>주차 정보</label>
        <textarea
          name="parkingInfo"
          placeholder="예) 건물 지하 1~3층 주차 가능 (3시간 무료)"
          rows={3}
          className={styles.textarea}
          value={form.parkingInfo}
          onChange={handleChange}
        />
      </div>

      {/* 기타 요청사항 */}
      <div>
        <label className={styles.labelBase}>추가 정보</label>
        <textarea
          name="additionalInfo"
          placeholder="꼭 포함하고 싶은 문구나 기타 요청 사항을 자유롭게 작성해주세요"
          rows={4}
          className={styles.textarea}
          value={form.additionalInfo}
          onChange={handleChange}
        />
      </div>

      <div className={styles.submitRow}>
        <button type="submit" disabled={!isValid} className={styles.primaryBtn}>
          다음
        </button>
      </div>
    </form>
  );
}
