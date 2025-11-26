import { Bell, Menu, Wifi, WifiOff, Moon, Sun, LogOut } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { FlashNotifications } from '@/components/FlashNotifications'
import { useNotificationStore } from '@/store/useNotificationStore'

export function Header() {
  const { toggleSidebar, darkMode, toggleDarkMode } = useStore()
  const { logout, user } = useAuth()
  const [isOnline, setIsOnline] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { notifications, unreadCount, markAsRead, loading } = useNotificationStore()
  
  // Initialize dark mode on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(clockInterval)
  }, [])

  useEffect(() => {
    // Simulate network status check
    const interval = setInterval(() => {
      // In production, this would check actual Zigbee network status
      setIsOnline(Math.random() > 0.1) // 90% uptime simulation
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const notifUnreadCount = useNotificationStore((state) => state.getUnreadCount())

  return (
    <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-slate-900/50 border-b border-gray-200 dark:border-white/10">
      <div className="flex items-center justify-between px-6 py-4 gap-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Central Hub Dashboard
            </h2>
            <div className="flex items-center space-x-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <p className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Flash Notifications - Inline */}
        <div className="flex-1 max-w-2xl hidden lg:block">
          <div className="bg-gradient-to-r from-slate-800/40 to-purple-900/40 dark:from-slate-800/60 dark:to-purple-900/60 rounded-lg border border-white/10 px-3 py-2 backdrop-blur-sm">
            <FlashNotifications />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Network Status */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
                  Mesh Network Active
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
                  Network Offline
                </span>
              </>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
          </button>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-white/10">
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
              {user?.username || 'Admin'}
            </span>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
