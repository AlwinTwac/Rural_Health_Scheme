import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`
}

export function getSeverityColor(severity) {
  const colors = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'success',
  }
  return colors[severity] || 'info'
}

export function getVitalStatus(value, type) {
  const ranges = {
    temperature: { low: 36.1, high: 37.2, critical: 38.5 },
    heartRate: { low: 60, high: 100, critical: 120 },
    bloodPressureSystolic: { low: 90, high: 120, critical: 140 },
    bloodPressureDiastolic: { low: 60, high: 80, critical: 90 },
  }

  const range = ranges[type]
  if (!range) return 'normal'

  if (value < range.low || value > range.critical) return 'critical'
  if (value > range.high) return 'warning'
  return 'normal'
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
