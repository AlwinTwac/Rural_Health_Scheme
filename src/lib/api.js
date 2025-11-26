import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const householdAPI = {
  getAll: () => api.get('/households'),
  getById: (id) => api.get(`/households/${id}`),
  create: (data) => api.post('/households', data),
  update: (id, data) => api.put(`/households/${id}`, data),
  delete: (id) => api.delete(`/households/${id}`),
  addMember: (householdId, data) => api.post(`/households/${householdId}/members`, data),
}

// Vital signs API
export const vitalsAPI = {
  getPatientsList: () => api.get('/patients/list'),
  recordVitals: (data) => api.post('/vitals/record', data),
  getPatientHistory: (patientId) => api.get(`/vitals/patient/${patientId}`),
  getLatestVitals: () => api.get('/vitals/latest'),
}

export const patientAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  getVitals: (id) => api.get(`/vitals/patient/${id}`), // Use existing endpoint
  getMedicalHistory: (id) => api.get(`/patients/${id}/history`),
  addDoctorComment: (patientId, vitalId, comment, doctorName) => 
    api.post(`/patients/${patientId}/vitals/${vitalId}/comment`, { 
      comment, 
      doctorName 
    }),
}

export const requestAPI = {
  getAll: () => api.get('/requests'),
  getActive: () => api.get('/requests/active'),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data),
  accept: (id) => api.post(`/requests/${id}/accept`),
  complete: (id, data) => api.post(`/requests/${id}/complete`, data),
  cancel: (id, reason) => api.post(`/requests/${id}/cancel`, { reason }),
}

export const tripAPI = {
  getOptimizedRoute: (requestIds) => api.post('/trips/optimize', { requestIds }),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
  getCurrent: () => api.get('/trips/current'),
  start: (data) => api.post('/trips/start', data),
  complete: (id) => api.post(`/trips/${id}/complete`),
  updateLocation: (lat, lon) => api.post('/trips/location', { lat, lon }),
}

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
}

export const deviceAPI = {
  getAll: () => api.get('/devices'),
  getById: (id) => api.get(`/devices/${id}`),
  getStatus: (id) => api.get(`/devices/${id}/status`),
  updateStatus: (id, status) => api.put(`/devices/${id}/status`, { status }),
}

export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
  getPatientStats: (patientId) => api.get(`/stats/patients/${patientId}`),
  getSystemHealth: () => api.get('/stats/system'),
}

// Export both named and default
export { api }
export default api
