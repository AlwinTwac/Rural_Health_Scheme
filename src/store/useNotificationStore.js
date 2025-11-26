import { create } from 'zustand'
import { notificationAPI } from '@/lib/api'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  
  // Fetch all notifications
  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const data = await notificationAPI.getAll()
      set({ 
        notifications: data,
        unreadCount: data.filter(n => !n.isRead).length
      })
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      // Fallback to mock data if API fails
      set({ 
        notifications: [
          {
            id: 1,
            type: 'info',
            household: 'Household A',
            message: 'Household A has sent a medical update',
            timestamp: new Date(Date.now() - 5 * 60000),
            isRead: false,
          }
        ],
        unreadCount: 1
      })
    } finally {
      set({ loading: false })
    }
  },
  
  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const data = await notificationAPI.getUnreadCount()
      set({ unreadCount: data.count })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  },
  
  // Mark notification as read
  markAsRead: async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  },
  
  // Add new notification (for real-time updates)
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    const { notifications } = get()
    const unreadNotifications = notifications.filter(n => !n.isRead)
    
    // Mark each unread notification as read
    await Promise.all(
      unreadNotifications.map(n => get().markAsRead(n.id))
    )
  },
  
  // Clear notification
  clearNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notif) => notif.id !== id),
    })),
  
  // Get unread count
  getUnreadCount: () => {
    const state = get()
    return state.notifications.filter((n) => !n.isRead).length
  },

  // Get latest notifications
  getLatestNotifications: (count = 2) => {
    const state = get()
    return state.notifications.slice(0, count)
  },
  
  // Get notifications by type
  getNotificationsByType: (type) => {
    const state = get()
    return state.notifications.filter(n => n.type === type)
  },
  
  // Get unread notifications
  getUnreadNotifications: () => {
    const state = get()
    return state.notifications.filter(n => !n.isRead)
  }
}))

// Initialize notifications on store creation
useNotificationStore.getState().fetchNotifications()
