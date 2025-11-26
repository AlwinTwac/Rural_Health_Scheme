import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/store/useNotificationStore'
import { AlertCircle, Wifi, WifiOff, Activity, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function FlashNotifications() {
  const navigate = useNavigate()
  const { notifications, markAsRead } = useNotificationStore()
  const latestNotifications = notifications.slice(0, 2)

  const getIcon = (type) => {
    switch (type) {
      case 'offline':
        return <WifiOff className="w-4 h-4 text-danger-500" />
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-warning-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning-500" />
      case 'info':
      case 'update':
        return <Activity className="w-4 h-4 text-info-500" />
      case 'success':
        return <Activity className="w-4 h-4 text-success-500" />
      default:
        return <Wifi className="w-4 h-4 text-primary-500" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'offline':
        return 'border-l-danger-500'
      case 'alert':
        return 'border-l-warning-500'
      case 'warning':
        return 'border-l-warning-500'
      case 'info':
        return 'border-l-info-500'
      case 'update':
        return 'border-l-success-500'
      case 'success':
        return 'border-l-success-500'
      default:
        return 'border-l-primary-500'
    }
  }

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    // If it's a medical update with patient data, navigate to patient details
    if (notification.type === 'info' && notification.patientId) {
      navigate(`/patients?patient=${notification.patientId}`)
    } else {
      navigate('/notifications')
    }
  }

  if (latestNotifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-4 py-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">No recent notifications</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {latestNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center space-x-2 px-2 py-1.5 rounded border-l-2 ${getTypeColor(
            notification.type
          )} hover:bg-white/10 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-pointer ${
            !notification.isRead ? 'bg-white/5 dark:bg-slate-800/30' : ''
          }`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex-shrink-0">{getIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-900 dark:text-white font-medium truncate">
              {notification.message}
            </p>
            {notification.patient && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                <User className="w-3 h-3 inline mr-1" />
                {notification.patient}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full mb-1"></div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
