import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  Route, 
  Activity,
  Settings,
  Menu,
  X,
  Home
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { DNAHelix } from '@/components/animations/DNAHelix'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Active Requests', href: '/requests', icon: Bell },
  { name: 'Households', href: '/households', icon: Home },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Trip Planner', href: '/trip-planner', icon: Route },
  { name: 'System Health', href: '/system', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'group fixed top-0 left-0 z-30 h-screen backdrop-blur-xl bg-white dark:bg-slate-900/80 border-r border-gray-200 dark:border-white/10 transition-all duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'w-16 hover:w-64'
        )}
      >
        {/* DNA Helix Background Animation */}
        <DNAHelix />
        
        <div className="flex flex-col h-full overflow-hidden relative z-10">
          {/* Header with MedHub logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">MedHub</h1>
                <p className="text-xs text-gray-600 dark:text-gray-200">Central Hub</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 dark:text-white text-purple-700 border border-purple-500/30 shadow-lg shadow-purple-500/20'
                      : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center space-x-3 px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">DR</span>
              </div>
              <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  Dr. Medical Professional
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-200">Online</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
