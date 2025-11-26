import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { 
  Users, 
  Search,
  User,
  Calendar,
  MapPin,
  Phone,
  FileText,
  Activity,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Send
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/context/AuthContext'
import { patientAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function Patients() {
  const { patients, setPatients, selectedPatient, setSelectedPatient } = useStore()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [vitalsHistory, setVitalsHistory] = useState([])
  const [doctorComment, setDoctorComment] = useState('')
  const [selectedVitalId, setSelectedVitalId] = useState(null)
  const [commenting, setCommenting] = useState(false)

  // Filter patients based on search query
  const filteredPatients = patients ? patients.filter(patient => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.patientId?.toLowerCase().includes(query) ||
      patient.household?.toLowerCase().includes(query) ||
      patient.gender?.toLowerCase().includes(query)
    )
  }) : []

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const data = await patientAPI.getAll()
      setPatients(data)
    } catch (error) {
      console.error('Failed to load patients:', error)
      // Use mock data
      setPatients(getMockPatients())
    } finally {
      setLoading(false)
    }
  }

  const getMockPatients = () => [
    {
      id: 'P001',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      household: 'Household A',
      householdId: 'H001',
      phone: '+263 77 123 4567',
      location: 'Village Center, 2.3km from hub',
      lastVisit: new Date('2024-11-01'),
      totalVisits: 12,
      conditions: ['Asthma', 'Hypertension'],
      medications: ['Albuterol', 'Lisinopril'],
      allergies: ['Penicillin'],
      vitalsHistory: [
        { date: '2024-10-15', temp: 36.8, hr: 72, bp: 125 },
        { date: '2024-10-22', temp: 37.1, hr: 75, bp: 128 },
        { date: '2024-10-29', temp: 36.9, hr: 73, bp: 122 },
        { date: '2024-11-01', temp: 39.2, hr: 105, bp: 140 },
      ],
      status: 'critical',
    },
    {
      id: 'P002',
      name: 'Mary Smith',
      age: 62,
      gender: 'Female',
      household: 'Household B',
      householdId: 'H002',
      phone: '+263 77 234 5678',
      location: 'East Village, 4.1km from hub',
      lastVisit: new Date('2024-10-28'),
      totalVisits: 24,
      conditions: ['Type 2 Diabetes', 'Arthritis'],
      medications: ['Metformin', 'Ibuprofen'],
      allergies: [],
      vitalsHistory: [
        { date: '2024-10-14', temp: 36.7, hr: 78, bp: 130 },
        { date: '2024-10-21', temp: 36.9, hr: 80, bp: 132 },
        { date: '2024-10-28', temp: 37.8, hr: 88, bp: 130 },
      ],
      status: 'stable',
    },
    {
      id: 'P003',
      name: 'Peter Johnson',
      age: 28,
      gender: 'Male',
      household: 'Household C',
      householdId: 'H003',
      phone: '+263 77 345 6789',
      location: 'South Village, 1.8km from hub',
      lastVisit: new Date('2024-10-15'),
      totalVisits: 5,
      conditions: [],
      medications: [],
      allergies: [],
      vitalsHistory: [
        { date: '2024-09-20', temp: 36.8, hr: 70, bp: 118 },
        { date: '2024-10-05', temp: 36.9, hr: 72, bp: 120 },
        { date: '2024-10-15', temp: 37.2, hr: 76, bp: 120 },
      ],
      status: 'healthy',
    },
  ]

  const getStatusColor = (status) => {
    const colors = {
      critical: 'danger',
      stable: 'warning',
      healthy: 'success',
    }
    return colors[status] || 'info'
  }

  // Load vitals history when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      console.log('Selected patient:', selectedPatient)
      // Use patientId (string) for the API call, not id (integer)
      loadVitalsHistory(selectedPatient.patientId)
    }
  }, [selectedPatient])

  const loadVitalsHistory = async (patientId) => {
    console.log('Loading vitals history for patient:', patientId)
    try {
      const data = await patientAPI.getVitals(patientId)
      console.log('Vitals history loaded:', data)
      
      // Handle the response format from the existing API
      if (data && data.history) {
        setVitalsHistory(data.history)
      } else if (Array.isArray(data)) {
        setVitalsHistory(data)
      } else {
        setVitalsHistory([])
      }
    } catch (error) {
      console.error('Failed to load vitals history:', error)
      setVitalsHistory([])
    }
  }

  const handleAddComment = async () => {
    console.log('Add comment clicked:', {
      doctorComment: doctorComment.trim(),
      selectedVitalId,
      selectedPatient: selectedPatient?.id,
      selectedPatientId: selectedPatient?.patientId
    })
    
    if (!doctorComment.trim() || !selectedVitalId || !selectedPatient) {
      console.log('Missing required fields')
      return
    }

    setCommenting(true)
    try {
      console.log('Calling API with:', {
        patientId: selectedPatient.id, // Use database ID for comment endpoint
        vitalId: selectedVitalId,
        comment: doctorComment.trim(),
        doctorName: user?.full_name || 'Doctor'
      })
      
      await patientAPI.addDoctorComment(
        selectedPatient.id, // Use database ID for comment endpoint
        selectedVitalId,
        doctorComment.trim(),
        user?.full_name || 'Doctor'
      )
      
      console.log('Comment added successfully')
      
      // Reset comment form
      setDoctorComment('')
      setSelectedVitalId(null)
      
      // Reload vitals history to show the new comment
      await loadVitalsHistory(selectedPatient.patientId) // Use patientId for loading
      
    } catch (error) {
      console.error('Failed to add doctor comment:', error)
    } finally {
      setCommenting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Records</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button>
          <User className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, ID, or household..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className={`cursor-pointer transition-all ${
                selectedPatient?.id === patient.id
                  ? 'ring-2 ring-primary-500'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPatient(patient)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{patient.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {patient.age} years • {patient.gender} • ID: {patient.id}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(patient.status)}>
                    {patient.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    {patient.household || 'Unknown'} • {patient.location ? `${patient.location.lat}, ${patient.location.lon}` : 'No location'}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Added: {formatDate(patient.createdAt)} • Patient ID: {patient.patientId}
                  </div>
                  {patient.vitals && (
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <Activity className="w-4 h-4 mr-2" />
                      <span>
                        Vitals: 
                        {patient.vitals.temperature && ` ${patient.vitals.temperature}°C`}
                        {patient.vitals.heartRate && ` ${patient.vitals.heartRate} bpm`}
                        {patient.vitals.bloodPressure && ` ${patient.vitals.bloodPressure.systolic}/${patient.vitals.bloodPressure.diastolic}`}
                        {!patient.vitals.temperature && !patient.vitals.heartRate && !patient.vitals.bloodPressure && ' No vitals recorded'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Patient Details */}
        <div className="lg:sticky lg:top-24 h-fit">
          {selectedPatient ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedPatient.name}</CardTitle>
                      <CardDescription>Patient ID: {selectedPatient.patientId}</CardDescription>
                    </div>
                    <Badge variant={getStatusColor(selectedPatient.status)}>
                      {selectedPatient.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Age</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedPatient.age} years</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Gender</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedPatient.gender}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Household</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedPatient.household || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Patient ID</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedPatient.patientId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vital Signs */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Latest Vital Signs</h4>
                    {selectedPatient.vitals ? (
                      <div className="space-y-3">
                        {selectedPatient.vitals.temperature && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Temperature</span>
                            <span className="font-medium text-gray-900 dark:text-white">{selectedPatient.vitals.temperature}°C</span>
                          </div>
                        )}
                        {selectedPatient.vitals.heartRate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Heart Rate</span>
                            <span className="font-medium text-gray-900 dark:text-white">{selectedPatient.vitals.heartRate} bpm</span>
                          </div>
                        )}
                        {selectedPatient.vitals.bloodPressure && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Blood Pressure</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedPatient.vitals.bloodPressure.systolic}/{selectedPatient.vitals.bloodPressure.diastolic} mmHg
                            </span>
                          </div>
                        )}
                        {selectedPatient.vitals.lastReading && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Last Reading</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatDate(selectedPatient.vitals.lastReading)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No vital signs recorded</p>
                    )}
                  </div>

                  {/* Doctor Comments Section */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Doctor Comments
                    </h4>
                    
                    {/* Add Comment Form */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <Textarea
                        placeholder="Add a comment about the latest readings..."
                        value={doctorComment}
                        onChange={(e) => setDoctorComment(e.target.value)}
                        className="mb-2"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!doctorComment.trim() || commenting}
                          size="sm"
                          className="flex items-center"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {commenting ? 'Adding...' : 'Add Comment'}
                        </Button>
                      </div>
                    </div>

                    {/* Vitals History with Comments */}
                    {vitalsHistory.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Readings & Comments</h5>
                        {vitalsHistory.slice(0, 5).map((vital) => (
                          <div key={vital.id} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {formatDate(vital.recordedAt)}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  {vital.vitals?.temperature && `Temp: ${vital.vitals.temperature}°C | `}
                                  {vital.vitals?.heartRate && `HR: ${vital.vitals.heartRate} bpm | `}
                                  {vital.vitals?.bloodPressure && 
                                    `BP: ${vital.vitals.bloodPressure.systolic}/${vital.vitals.bloodPressure.diastolic} mmHg`
                                  }
                                </div>
                              </div>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setSelectedVitalId(vital.id)}
                                className={selectedVitalId === vital.id ? 'bg-primary-100 dark:bg-primary-900' : ''}
                              >
                                Comment
                              </Button>
                            </div>
                            
                            {vital.doctorComment && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-500">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                    Dr. {vital.commentedBy}
                                  </span>
                                  <span className="text-xs text-blue-600 dark:text-blue-400">
                                    {formatDate(vital.commentedAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{vital.doctorComment}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {vitalsHistory.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No vitals history available</p>
                    )}
                  </div>

                  {/* Location */}
                  {selectedPatient.location && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Location</h4>
                      <div className="text-sm">
                        <p className="text-gray-600 dark:text-gray-300">Coordinates</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedPatient.location.lat}, {selectedPatient.location.lon}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Medical Info */}
                  {selectedPatient.conditions && selectedPatient.conditions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Medical Conditions</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.conditions.map((condition, index) => (
                          <Badge key={index} variant="warning">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPatient.medications && selectedPatient.medications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Current Medications</h4>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                        {selectedPatient.medications.map((med, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2"></span>
                            {med}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Allergies</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.allergies.map((allergy, index) => (
                          <Badge key={index} variant="danger">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vitals History */}
              {selectedPatient.vitalsHistory && selectedPatient.vitalsHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vitals History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={selectedPatient.vitalsHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="bp" stroke="#0ea5e9" name="BP (systolic)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  Select a patient to view their details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
