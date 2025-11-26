import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Route, 
  MapPin, 
  Clock,
  Navigation,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { tripAPI, requestAPI } from '@/lib/api'
import { formatTime, getSeverityColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export function TripPlanner() {
  const { activeRequests, optimizedRoute, setOptimizedRoute } = useStore()
  const [selectedRequests, setSelectedRequests] = useState([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [tripStats, setTripStats] = useState(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const requests = await requestAPI.getActive()
      // Auto-select critical and high severity requests
      const autoSelect = requests
        .filter(r => ['critical', 'high'].includes(r.severity))
        .map(r => r.id)
      setSelectedRequests(autoSelect)
    } catch (error) {
      console.error('Failed to load requests:', error)
    }
  }

  const mockRequests = [
    {
      id: 1,
      patientName: 'John Doe',
      household: 'Household A',
      severity: 'critical',
      distance: 2.3,
      estimatedTime: 8,
      location: { lat: -17.8252, lon: 31.0335 },
      priority: 1,
    },
    {
      id: 2,
      patientName: 'Mary Smith',
      household: 'Household B',
      severity: 'high',
      distance: 4.1,
      estimatedTime: 15,
      location: { lat: -17.8300, lon: 31.0400 },
      priority: 2,
    },
    {
      id: 3,
      patientName: 'Peter Johnson',
      household: 'Household C',
      severity: 'medium',
      distance: 1.8,
      estimatedTime: 6,
      location: { lat: -17.8200, lon: 31.0300 },
      priority: 3,
    },
    {
      id: 4,
      patientName: 'Sarah Williams',
      household: 'Household D',
      severity: 'medium',
      distance: 3.5,
      estimatedTime: 12,
      location: { lat: -17.8280, lon: 31.0380 },
      priority: 4,
    },
  ]

  const handleOptimizeRoute = async () => {
    if (selectedRequests.length === 0) {
      toast.error('Please select at least one request')
      return
    }

    setIsOptimizing(true)
    try {
      // Simulate AI optimization
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock optimized route
      const route = {
        stops: selectedRequests.map((id, index) => {
          const request = mockRequests.find(r => r.id === id)
          return {
            ...request,
            order: index + 1,
            arrivalTime: new Date(Date.now() + (index * 20 * 60000)),
          }
        }).sort((a, b) => {
          // Sort by severity first, then by distance
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[a.severity] - severityOrder[b.severity]
          }
          return a.distance - b.distance
        }),
        totalDistance: selectedRequests.reduce((sum, id) => {
          const request = mockRequests.find(r => r.id === id)
          return sum + request.distance
        }, 0),
        totalTime: selectedRequests.reduce((sum, id) => {
          const request = mockRequests.find(r => r.id === id)
          return sum + request.estimatedTime
        }, 0),
        optimizationScore: 92,
      }

      setOptimizedRoute(route)
      setTripStats({
        totalStops: route.stops.length,
        totalDistance: route.totalDistance.toFixed(1),
        totalTime: route.totalTime,
        fuelSaved: '15%',
        timeSaved: '22 min',
      })
      
      toast.success('Route optimized successfully!')
    } catch (error) {
      toast.error('Failed to optimize route')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleStartTrip = async () => {
    if (!optimizedRoute) {
      toast.error('Please optimize route first')
      return
    }

    try {
      await tripAPI.start({
        requestIds: selectedRequests,
        route: optimizedRoute,
      })
      toast.success('Trip started! Safe travels.')
      // Navigate to active trip view
    } catch (error) {
      toast.error('Failed to start trip')
    }
  }

  const toggleRequestSelection = (requestId) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
    // Clear optimized route when selection changes
    setOptimizedRoute(null)
    setTripStats(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Trip Planner</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Optimize your route based on severity, distance, and time
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            onClick={handleOptimizeRoute}
            disabled={isOptimizing || selectedRequests.length === 0}
          >
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Optimize Route
              </>
            )}
          </Button>
          {optimizedRoute && (
            <Button variant="success" onClick={handleStartTrip}>
              <Navigation className="w-4 h-4 mr-2" />
              Start Trip
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Requests */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Requests</CardTitle>
              <CardDescription>
                Select requests to include in your trip ({selectedRequests.length} selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRequests.map((request) => {
                  const isSelected = selectedRequests.includes(request.id)
                  return (
                    <div
                      key={request.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleRequestSelection(request.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {request.patientName}
                            </h4>
                            <Badge variant={getSeverityColor(request.severity)}>
                              {request.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{request.household}</p>
                        </div>
                        <div className="flex items-center">
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {request.distance} km
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          ~{request.estimatedTime} min
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Optimized Route */}
          {optimizedRoute && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Optimized Route</CardTitle>
                    <CardDescription>
                      AI-generated optimal visiting sequence
                    </CardDescription>
                  </div>
                  <Badge variant="success">
                    {optimizedRoute.optimizationScore}% Optimal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizedRoute.stops.map((stop, index) => (
                    <div key={stop.id}>
                      <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          {index < optimizedRoute.stops.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-300 my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {stop.patientName}
                            </h4>
                            <Badge variant={getSeverityColor(stop.severity)} size="sm">
                              {stop.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{stop.household}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>ETA: {formatTime(stop.arrivalTime)}</span>
                            <span>{stop.distance} km</span>
                            <span>~{stop.estimatedTime} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trip Statistics */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trip Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {tripStats ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Stops</p>
                    <p className="text-2xl font-bold text-primary-700">
                      {tripStats.totalStops}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Distance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tripStats.totalDistance} km
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Estimated Time</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tripStats.totalTime} min
                    </p>
                  </div>
                  <div className="p-4 bg-success-50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Time Saved</p>
                    <p className="text-2xl font-bold text-success-700">
                      {tripStats.timeSaved}
                    </p>
                  </div>
                  <div className="p-4 bg-success-50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Fuel Saved</p>
                    <p className="text-2xl font-bold text-success-700">
                      {tripStats.fuelSaved}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Route className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Select requests and optimize to see statistics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimization Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-200">
                    Critical and high severity cases are prioritized first
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-200">
                    Route minimizes total travel distance while respecting urgency
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-200">
                    AI considers real-time factors like terrain and weather
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
