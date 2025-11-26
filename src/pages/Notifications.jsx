import { useState } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AlertCircle, Wifi, WifiOff, Activity, Trash2, CheckCheck } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export function Notifications() {
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotificationStore()
  const [filter, setFilter] = useState('all') // all, unread, read

  const getIcon = (type) => {
    switch (type) {
      case 'offline':
        return <WifiOff className="w-5 h-5 text-danger-500" />
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-warning-500" />
      case 'update':
        return <Activity className="w-5 h-5 text-success-500" />
      default:
        return <Wifi className="w-5 h-5 text-primary-500" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'offline':
        return 'border-l-danger-500 bg-danger-50 dark:bg-danger-900/10'
      case 'alert':
        return 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/10'
      case 'update':
        return 'border-l-success-500 bg-success-50 dark:bg-success-900/10'
      default:
        return 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/10'
    }
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'offline':
        return <Badge variant="danger">Offline</Badge>
      case 'alert':
        return <Badge variant="warning">Alert</Badge>
      case 'update':
        return <Badge variant="success">Update</Badge>
      default:
        return <Badge variant="default">Info</Badge>
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications & System Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : 'No notifications to display'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-l-4 ${getTypeColor(notification.type)} ${
                !notification.read ? 'shadow-md' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {notification.household}
                        </h3>
                        {getTypeBadge(notification.type)}
                        {!notification.read && (
                          <Badge variant="primary" size="sm">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </span>
                        <span>•</span>
                        <span>
                          {format(notification.timestamp, 'MMM dd, yyyy • hh:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
