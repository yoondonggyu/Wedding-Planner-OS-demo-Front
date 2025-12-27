import React from 'react'
import HomeCalendar from '@/components/sections/HomeCalendar'
import '@/components/sections/HomeCalendar.css'
import './HomeView.css'

export default function HomeView() {
  return (
    <div className="home-view">
      <div className="home-content">
        <HomeCalendar />
      </div>
    </div>
  )
}

