<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import { useRouter } from 'vue-router'

interface CalendarEvent {
  id: number
  title: string
  start_date: string
  start_time?: string | null
  category: string
  priority: 'low' | 'medium' | 'high'
}

const authStore = useAuthStore()
const { request } = useApi()
const router = useRouter()

const currentDate = ref(new Date())
const events = ref<CalendarEvent[]>([])
const weddingDate = ref<string | null>(null)
const dDay = ref<number | null>(null)

const currentMonthText = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}년 ${month}월`
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
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
    
    let dayEvents = events.value.filter((e) => e.start_date === dateStr)
    
    if (weddingDate.value && weddingDate.value === dateStr) {
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
      isCurrentMonth: date.getMonth() === month,
      isToday,
      events: dayEvents,
    })
  }

  return days
})

async function loadData() {
  if (!authStore.user?.id) {
    return
  }
  
  try {
    await Promise.all([loadEvents(), loadWeddingDate()])
    updateDDay()
  } catch (err) {
    console.error('데이터 로드 실패:', err)
  }
}

async function loadEvents() {
  if (!authStore.user?.id) {
    events.value = []
    return
  }
  
  try {
    const res = await request<{ message: string; data: { events: CalendarEvent[] } }>(
      `/calendar/todos`,
      { method: 'GET' }
    )
    if (res.message === 'todos_retrieved') {
      events.value = res.data.events || []
    }
  } catch (err) {
    console.error('일정 로드 실패:', err)
    events.value = []
  }
}

async function loadWeddingDate() {
  if (!authStore.user?.id) {
    weddingDate.value = null
    dDay.value = null
    return
  }
  
  try {
    const res = await request<{ message: string; data: { wedding_date: string | null } }>(
      `/calendar/wedding-date`,
      { method: 'GET' }
    )
    if (res.message === 'wedding_date_retrieved' && res.data?.wedding_date) {
      weddingDate.value = res.data.wedding_date
      updateDDay()
    }
  } catch (err) {
    console.error('예식일 로드 실패:', err)
  }
}

function updateDDay() {
  if (!weddingDate.value) {
    dDay.value = null
    return
  }
  
  const [year, month, day] = weddingDate.value.split('-').map(Number)
  const wedding = new Date(year, month - 1, day)
  wedding.setHours(0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const diff = Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  dDay.value = diff
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function goToCalendar() {
  router.push('/calendar')
}

// 로그인 상태 변경 감지
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      loadData()
    } else {
      events.value = []
      weddingDate.value = null
      dDay.value = null
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadData()
  }
})
</script>

<template>
  <div class="home-calendar">
    <div class="calendar-header-section">
      <div class="calendar-title-section">
        <h2>📅 일정 관리</h2>
        <button class="view-all-btn" @click="goToCalendar">전체 보기</button>
      </div>
      <div v-if="dDay !== null" class="d-day-badge">
        <span v-if="dDay > 0">D-{{ dDay }}</span>
        <span v-else-if="dDay === 0">D-Day!</span>
        <span v-else>D+{{ Math.abs(dDay) }}</span>
      </div>
    </div>

    <div class="calendar-widget">
      <div class="calendar-nav">
        <button class="nav-btn" @click="prevMonth">◀</button>
        <span class="month-text">{{ currentMonthText }}</span>
        <button class="nav-btn" @click="nextMonth">▶</button>
      </div>
      
      <div class="calendar-grid">
        <div
          v-for="dayName in ['일', '월', '화', '수', '목', '금', '토']"
          :key="dayName"
          class="day-header"
        >
          {{ dayName }}
        </div>
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
          }"
        >
          <div class="day-number">{{ day.date.getDate() }}</div>
          <div class="day-events">
            <div
              v-for="(event, eIdx) in day.events.slice(0, 2)"
              :key="eIdx"
              class="event-dot"
              :class="{
                'wedding-event': event.category === 'wedding' || event.id === -1,
                'high-priority': event.priority === 'high',
                'medium-priority': event.priority === 'medium',
                'low-priority': event.priority === 'low',
              }"
              :title="event.title"
            ></div>
            <div v-if="day.events.length > 2" class="more-events">+{{ day.events.length - 2 }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!authStore.isAuthenticated" class="login-prompt">
      <p>로그인하면 일정을 관리할 수 있습니다</p>
      <button class="login-btn" @click="authStore.openLoginModal()">로그인</button>
    </div>
  </div>
</template>

<style scoped>
.home-calendar {
  background: var(--card);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.calendar-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.calendar-title-section h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.view-all-btn {
  padding: 6px 12px;
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.d-day-badge {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-radius: 20px;
  color: white;
  font-size: 16px;
  font-weight: 700;
}

.calendar-widget {
  margin-top: 16px;
}

.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.nav-btn {
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.month-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-header {
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: var(--muted);
  padding: 8px 4px;
}

.calendar-day {
  aspect-ratio: 1;
  min-height: 40px;
  padding: 4px;
  background: var(--soft);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.calendar-day:hover {
  background: rgba(139, 92, 246, 0.1);
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.today {
  background: rgba(139, 92, 246, 0.2);
  border: 2px solid var(--accent);
}

.day-number {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}

.day-events {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.event-dot.wedding-event {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  width: 8px;
  height: 8px;
}

.event-dot.high-priority {
  background: var(--danger);
}

.event-dot.medium-priority {
  background: var(--warn);
}

.event-dot.low-priority {
  background: var(--ok);
}

.more-events {
  font-size: 9px;
  color: var(--muted);
  font-weight: 600;
}

.login-prompt {
  text-align: center;
  padding: 24px;
  margin-top: 16px;
  background: var(--soft);
  border-radius: 12px;
}

.login-prompt p {
  margin: 0 0 12px 0;
  color: var(--muted);
  font-size: 14px;
}

.login-btn {
  padding: 10px 20px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  background: var(--accent-2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .home-calendar {
    padding: 16px;
    margin-bottom: 16px;
  }

  .calendar-title-section h2 {
    font-size: 18px;
  }

  .calendar-day {
    min-height: 35px;
    padding: 3px;
  }

  .day-number {
    font-size: 11px;
  }

  .event-dot {
    width: 5px;
    height: 5px;
  }

  .event-dot.wedding-event {
    width: 6px;
    height: 6px;
  }
}
</style>

