import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from 'react-hot-toast'
import { WelcomeScreen } from '../WelcomeScreen'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

export function Layout() {
  const { user, showWelcome, setShowWelcome } = useAuth()
  const [showDashboard, setShowDashboard] = useState(!showWelcome)

  const handleWelcomeComplete = () => {
    // Start fading in dashboard
    setShowDashboard(true)
    // Remove welcome screen after a brief delay
    setTimeout(() => {
      setShowWelcome(false)
    }, 100)
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Welcome Screen */}
      {showWelcome && (
        <WelcomeScreen 
          onComplete={handleWelcomeComplete} 
          userName={user?.username || user?.name}
        />
      )}

      {/* Main Dashboard - with smooth fade in effect */}
      <div className={`flex-1 flex h-screen transition-all duration-1000 ease-out ${showDashboard ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Animated gradient background */}
        <div className="fixed inset-0 bg-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 animate-gradient-shift -z-10">
          {/* Animated gradient orbs - only in dark mode */}
          <div className="hidden dark:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="hidden dark:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Medical watermark - MedHub Connect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Medical Cross Symbol */}
            <div className="absolute opacity-[0.03] dark:opacity-[0.05]">
              <svg width="600" height="600" viewBox="0 0 200 200" className="text-gray-400 dark:text-white">
                <path
                  d="M70 0 H130 V70 H200 V130 H130 V200 H70 V130 H0 V70 H70 Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            
            {/* MedHub Connect Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-15deg]">
              <h1 className="text-[120px] font-bold opacity-[0.02] dark:opacity-[0.04] text-gray-400 dark:text-white whitespace-nowrap select-none">
                MedHub Connect
              </h1>
            </div>
          </div>
        </div>
        
        <Sidebar />
        
        <div className="relative flex-1 flex flex-col lg:ml-64 z-10 transition-all duration-300">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'dark:bg-slate-800 dark:text-gray-100',
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </div>
  )
}
