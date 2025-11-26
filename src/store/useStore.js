import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Theme
      darkMode: false,
      toggleDarkMode: () => {
        const newMode = !get().darkMode
        set({ darkMode: newMode })
        if (newMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
      
      // Patients
      patients: [],
      selectedPatient: null,
      setPatients: (patients) => set({ patients }),
      setSelectedPatient: (patient) => set({ selectedPatient: patient }),
  
  // Requests
  requests: [],
  activeRequests: [],
  setRequests: (requests) => set({ requests }),
  setActiveRequests: (activeRequests) => set({ activeRequests }),
  addRequest: (request) => set((state) => ({
    requests: [request, ...state.requests],
    activeRequests: [request, ...state.activeRequests],
  })),
  updateRequest: (id, updates) => set((state) => ({
    requests: state.requests.map((r) => r.id === id ? { ...r, ...updates } : r),
    activeRequests: state.activeRequests.map((r) => r.id === id ? { ...r, ...updates } : r),
  })),
  removeActiveRequest: (id) => set((state) => ({
    activeRequests: state.activeRequests.filter((r) => r.id !== id),
  })),
  
  // Trip
  currentTrip: null,
  optimizedRoute: null,
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setOptimizedRoute: (route) => set({ optimizedRoute: route }),
  
  // Devices
  devices: [],
  setDevices: (devices) => set({ devices }),
  updateDeviceStatus: (id, status) => set((state) => ({
    devices: state.devices.map((d) => d.id === id ? { ...d, status } : d),
  })),
  
  // Stats
  dashboardStats: null,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  
  // UI State
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // Notifications
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [
      { id: Date.now(), timestamp: new Date(), ...notification },
      ...state.notifications,
    ].slice(0, 50), // Keep last 50 notifications
  })),
  clearNotifications: () => set({ notifications: [] }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
}),
{
  name: 'rural-health-storage',
  partialize: (state) => ({ darkMode: state.darkMode }),
}
)
)
