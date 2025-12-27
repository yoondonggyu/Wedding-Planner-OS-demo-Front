import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import './HomeCalendar.css'

interface CalendarEvent {
  id: number
  title: string
  start_date: string
  start_time?: string | null
  category: string
  priority: 'low' | 'medium' | 'high'
}

export default function HomeCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [weddingDate, setWeddingDate] = useState<string | null>(null)
  const [dDay, setDDay] = useState<number | null>(null)

  const authStore = useAuthStore()
  const { request } = useApi()
  const navigate = useNavigate()

  const currentMonthText = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    return `${year}년 ${month}월`
  }, [currentDate])

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const days: Array<{
      date: Date
      isCurrentMonth: boolean
      isToday: boolean
      events: CalendarEvent[]
    }> = []

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      let dayEvents = events.filter((e) => e.start_date === dateStr)
      
      if (weddingDate && weddingDate === dateStr) {
        const hasWeddingEvent = dayEvents.some((e) => e.title.includes('예식일') || e.category === 'wedding')
        if (!hasWeddingEvent) {
          dayEvents = [
            ...dayEvents,
            {
              id: -1,
              title: '예식일',
              start_date: dateStr,
              category: 'wedding',
              priority: 'high' as const,
            } as CalendarEvent,
          ]
        }
      }
      
      const isToday = date.toDateString() === new Date().toDateString()

      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday,
        events: dayEvents,
      })
    }

    return days
  }, [currentDate, events, weddingDate])

  const loadEvents = useCallback(async () => {
    if (!authStore.user?.id) {
      setEvents([])
      return
    }
    
    try {
      const res = await request<{ message: string; data: { events: CalendarEvent[] } }>(
        `/calendar/todos`,
        { method: 'GET' }
      )
      if (res.message === 'todos_retrieved') {
        setEvents(res.data.events || [])
      }
    } catch (err) {
      console.error('일정 로드 실패:', err)
      setEvents([])
    }
  }, [authStore.user?.id, request])

  const updateDDay = useCallback((weddingDateValue: string) => {
    if (!weddingDateValue) {
      setDDay(null)
      return
    }
    
    const [year, month, day] = weddingDateValue.split('-').map(Number)
    const wedding = new Date(year, month - 1, day)
    wedding.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const diff = Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    setDDay(diff)
  }, [])

  const loadWeddingDate = useCallback(async () => {
    if (!authStore.user?.id) {
      setWeddingDate(null)
      setDDay(null)
      return
    }
    
    try {
      const res = await request<{ message: string; data: { wedding_date: string | null } }>(
        `/calendar/wedding-date`,
        { method: 'GET' }
      )
      if (res.message === 'wedding_date_retrieved' && res.data?.wedding_date) {
        setWeddingDate(res.data.wedding_date)
        updateDDay(res.data.wedding_date)
      }
    } catch (err) {
      console.error('예식일 로드 실패:', err)
    }
  }, [authStore.user?.id, request, updateDDay])

  const prevMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }, [currentDate])

  const nextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }, [currentDate])

  const goToCalendar = useCallback(() => {
    navigate('/calendar')
  }, [navigate])

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      setEvents([])
      setWeddingDate(null)
      setDDay(null)
      return
    }
    
    // 의존성 배열에서 함수를 제거하고 직접 호출
    const userId = authStore.user.id
    
    const fetchData = async () => {
      try {
        // loadEvents 로직 직접 구현
        const eventsRes = await request<{ message: string; data: { events: CalendarEvent[] } }>(
          `/calendar/todos`,
          { method: 'GET' }
        )
        if (eventsRes.message === 'todos_retrieved') {
          setEvents(eventsRes.data.events || [])
        }
        
        // loadWeddingDate 로직 직접 구현
        const weddingRes = await request<{ message: string; data: { wedding_date: string | null } }>(
          `/calendar/wedding-date`,
          { method: 'GET' }
        )
        if (weddingRes.message === 'wedding_date_retrieved' && weddingRes.data?.wedding_date) {
          const weddingDateValue = weddingRes.data.wedding_date
          setWeddingDate(weddingDateValue)
          // updateDDay 로직 직접 구현
          const [year, month, day] = weddingDateValue.split('-').map(Number)
          const wedding = new Date(year, month - 1, day)
          wedding.setHours(0, 0, 0, 0)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const diff = Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          setDDay(diff)
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err)
      }
    }
    
    fetchData()
  }, [authStore.isAuthenticated, authStore.user?.id, request])

  return (
    <div className="home-calendar">
      <div className="calendar-header-section">
        <div className="calendar-title-section">
          <h2>📅 일정 관리</h2>
          <button className="view-all-btn" onClick={goToCalendar}>전체 보기</button>
        </div>
        {dDay !== null && (
          <div className="d-day-badge">
            {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day!' : `D+${Math.abs(dDay)}`}
          </div>
        )}
      </div>

      <div className="calendar-widget">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={prevMonth}>◀</button>
          <span className="month-text">{currentMonthText}</span>
          <button className="nav-btn" onClick={nextMonth}>▶</button>
        </div>
        
        <div className="calendar-grid">
          {['일', '월', '화', '수', '목', '금', '토'].map((dayName) => (
            <div key={dayName} className="day-header">
              {dayName}
            </div>
          ))}
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
            >
              <div className="day-number">{day.date.getDate()}</div>
              <div className="day-events">
                {day.events.slice(0, 2).map((event, eIdx) => (
                  <div
                    key={eIdx}
                    className={`event-dot ${
                      event.category === 'wedding' || event.id === -1 ? 'wedding-event' : ''
                    } ${event.priority === 'high' ? 'high-priority' : event.priority === 'medium' ? 'medium-priority' : 'low-priority'}`}
                    title={event.title}
                  />
                ))}
                {day.events.length > 2 && (
                  <div className="more-events">+{day.events.length - 2}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!authStore.isAuthenticated && (
        <div className="login-prompt">
          <p>로그인하면 일정을 관리할 수 있습니다</p>
          <button className="login-btn" onClick={() => authStore.openLoginModal()}>로그인</button>
        </div>
      )}
    </div>
  )
}

