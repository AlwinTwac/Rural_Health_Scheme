import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Requests } from '@/pages/Requests'
import { TripPlanner } from '@/pages/TripPlanner'
import { Patients } from '@/pages/Patients'
import { Households } from '@/pages/Households'
import { Notifications } from '@/pages/Notifications'
import { SystemHealth } from '@/pages/SystemHealth'
import { Settings } from '@/pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="requests" element={<Requests />} />
            <Route path="households" element={<Households />} />
            <Route path="patients" element={<Patients />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="trip-planner" element={<TripPlanner />} />
            <Route path="system-health" element={<SystemHealth />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
