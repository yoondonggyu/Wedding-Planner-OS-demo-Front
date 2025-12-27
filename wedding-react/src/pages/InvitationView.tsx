import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { InvitationProvider } from '@/contexts/InvitationContext'
import { BasicInfoPage } from './invitation/BasicInfoPage'
import { ToneSelectPage } from './invitation/ToneSelectPage'
import { ImageUploadPage } from './invitation/ImageUploadPage'
import { DesignDetailPage } from './invitation/DesignDetailPage'
import { ResultPage } from './invitation/ResultPage'
import { OptionSelectPage } from './invitation/OptionSelectPage'
import { ThreeDInvitePage } from './invitation/3D/ThreeDInvitePage'
import { ThreeDInvitationResultPage } from './invitation/3D/ThreeDInvitationResultPage'
import { SamplePage } from './invitation/3D/SamplePage'

function InvitationRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="info" replace />} />
      <Route path="info" element={<BasicInfoPage />} />
      <Route path="tone" element={<ToneSelectPage />} />
      <Route path="image" element={<ImageUploadPage />} />
      <Route path="design" element={<DesignDetailPage />} />
      <Route path="result" element={<ResultPage />} />
      <Route path="options" element={<OptionSelectPage />} />
      <Route path="3d" element={<ThreeDInvitePage />} />
      <Route path="3d/result" element={<ThreeDInvitationResultPage />} />
      <Route path="3d/sample" element={<SamplePage />} />
    </Routes>
  )
}

export default function InvitationView() {
  return (
    <InvitationProvider>
      <InvitationRoutes />
    </InvitationProvider>
  )
}
