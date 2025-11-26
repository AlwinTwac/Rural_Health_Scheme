import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { 
  Clock, 
  MapPin, 
  Thermometer, 
  Heart, 
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { requestAPI } from '@/lib/api'
import { formatDateTime, getSeverityColor, getVitalStatus } from '@/lib/utils'
import toast from 'react-hot-toast'

export function Requests() {
  const { activeRequests, setActiveRequests, updateRequest } = useStore()
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
    
    // Refresh every 15 seconds
    const interval = setInterval(loadRequests, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadRequests = async () => {
    try {
      const requests = await requestAPI.getActive()
      setActiveRequests(requests)
    } catch (error) {
      console.error('Failed to load requests:', error)
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      await requestAPI.accept(requestId)
      updateRequest(requestId, { status: 'accepted' })
      toast.success('Request accepted')
      setShowDetails(false)
    } catch (error) {
      toast.error('Failed to accept request')
    }
  }

  const handleCompleteRequest = async (requestId) => {
    try {
      await requestAPI.complete(requestId, { notes: 'Visit completed' })
      updateRequest(requestId, { status: 'completed' })
      toast.success('Request completed')
      setShowDetails(false)
    } catch (error) {
      toast.error('Failed to complete request')
    }
  }

  const handleCancelRequest = async (requestId, reason) => {
    try {
      await requestAPI.cancel(requestId, reason)
      updateRequest(requestId, { status: 'cancelled' })
      toast.success('Request cancelled')
      setShowDetails(false)
    } catch (error) {
      toast.error('Failed to cancel request')
    }
  }

  const VitalSign = ({ icon: Icon, label, value, unit, status }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        status === 'critical' ? 'bg-danger-100 dark:bg-danger-900/30' :
        status === 'warning' ? 'bg-warning-100 dark:bg-warning-900/30' :
        'bg-success-100 dark:bg-success-900/30'
      }`}>
        <Icon className={`w-5 h-5 ${
          status === 'critical' ? 'text-danger-600 dark:text-danger-400' :
          status === 'warning' ? 'text-warning-600 dark:text-warning-400' :
          'text-success-600 dark:text-success-400'
        }`} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {value} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{unit}</span>
        </p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const requests = activeRequests

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Requests</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {requests.length} pending request{requests.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => window.location.href = '/trip-planner'}>
          Plan Route
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests List */}
        <div className="space-y-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className={`cursor-pointer transition-all ${
                selectedRequest?.id === request.id
                  ? 'ring-2 ring-primary-500'
                  : 'hover:shadow-md'
              }`}
              onClick={() => {
                setSelectedRequest(request)
                setShowDetails(true)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {request.patientName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      {request.age} years • {request.gender} • {request.household}
                    </p>
                  </div>
                  <Badge variant={getSeverityColor(request.severity)}>
                    {request.severity}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">{request.symptoms}</p>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDateTime(request.timestamp)}
                  </span>
                  <span className="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 mr-1" />
                    {request.distance} km • {request.estimatedTravelTime} min
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-2 bg-gray-50 dark:bg-slate-800/50 rounded">
                    <Thermometer className="w-4 h-4 mx-auto text-danger-600 mb-1" />
                    <p className="text-xs text-gray-600 dark:text-gray-300">Temp</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.vitals.temperature}°C</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-slate-800/50 rounded">
                    <Heart className="w-4 h-4 mx-auto text-primary-600 mb-1" />
                    <p className="text-xs text-gray-600 dark:text-gray-300">HR</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.vitals.heartRate} bpm</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-slate-800/50 rounded">
                    <Activity className="w-4 h-4 mx-auto text-success-600 mb-1" />
                    <p className="text-xs text-gray-600 dark:text-gray-300">BP</p>
                    <p className="text-sm font-semibold">
                      {request.vitals.bloodPressure.systolic}/{request.vitals.bloodPressure.diastolic}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {requests.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Requests
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  All requests have been handled. Great work!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Request Details */}
        <div className="lg:sticky lg:top-24 h-fit">
          {showDetails && selectedRequest ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedRequest.patientName}</CardTitle>
                    <CardDescription>
                      Patient ID: {selectedRequest.patientId} • {selectedRequest.household}
                    </CardDescription>
                  </div>
                  <Badge variant={getSeverityColor(selectedRequest.severity)}>
                    {selectedRequest.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patient Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Age</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.age} years</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Gender</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.gender}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Distance</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.distance} km</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Est. Travel</p>
                      <p className="font-medium">{selectedRequest.estimatedTravelTime} min</p>
                    </div>
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Reported Symptoms</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                    {selectedRequest.symptoms}
                  </p>
                </div>

                {/* Vital Signs */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Vital Signs</h4>
                  <div className="space-y-2">
                    <VitalSign
                      icon={Thermometer}
                      label="Temperature"
                      value={selectedRequest.vitals.temperature}
                      unit="°C"
                      status={getVitalStatus(selectedRequest.vitals.temperature, 'temperature')}
                    />
                    <VitalSign
                      icon={Heart}
                      label="Heart Rate"
                      value={selectedRequest.vitals.heartRate}
                      unit="bpm"
                      status={getVitalStatus(selectedRequest.vitals.heartRate, 'heartRate')}
                    />
                    <VitalSign
                      icon={Activity}
                      label="Blood Pressure"
                      value={`${selectedRequest.vitals.bloodPressure.systolic}/${selectedRequest.vitals.bloodPressure.diastolic}`}
                      unit="mmHg"
                      status={getVitalStatus(selectedRequest.vitals.bloodPressure.systolic, 'bloodPressureSystolic')}
                    />
                  </div>
                </div>

                {/* Notes */}
                {selectedRequest.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Additional Notes</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <AlertCircle className="w-4 h-4 inline mr-2 text-blue-600" />
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAcceptRequest(selectedRequest.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept & Start Visit
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCompleteRequest(selectedRequest.id)}
                  >
                    Mark as Completed
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Request
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Click on a request to view details and take action
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
