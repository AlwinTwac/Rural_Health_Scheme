import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Phone,
  Thermometer,
  Heart,
  Activity,
  User,
  Calendar,
  Plus,
  X
} from 'lucide-react';
import { householdAPI, vitalsAPI } from '../lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export function Households() {
  const [expandedHousehold, setExpandedHousehold] = useState(null)
  const [households, setHouseholds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddHousehold, setShowAddHousehold] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const [newHousehold, setNewHousehold] = useState({
    household_name: '',
    village: '',
    phone: '',
    latitude: '',
    longitude: ''
  })
  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    gender: '',
    relation_to_head: '',
    latitude: '',
    longitude: ''
  })

  useEffect(() => {
    loadHouseholds()
  }, [])

  const loadHouseholds = async () => {
    try {
      const data = await householdAPI.getAll()
      setHouseholds(data)
    } catch (error) {
      console.error('Failed to load households:', error)
      toast.error('Failed to load households')
    } finally {
      setLoading(false)
    }
  }

  const handleAddHousehold = async () => {
    try {
      const household = await householdAPI.create(newHousehold)
      setHouseholds([...households, household])
      setShowAddHousehold(false)
      setNewHousehold({
        household_name: '',
        village: '',
        phone: '',
        latitude: '',
        longitude: ''
      })
      toast.success('Household created successfully')
    } catch (error) {
      console.error('Failed to create household:', error)
      toast.error('Failed to create household')
    }
  }

  const handleAddMember = async () => {
    try {
      const member = await householdAPI.addMember(selectedHousehold, newMember)
      // Update the household in state
      setHouseholds(households.map(h => {
        if (h.id === selectedHousehold) {
          return { ...h, members: [...(h.members || []), member] }
        }
        return h
      }))
      setShowAddMember(false)
      setNewMember({
        name: '',
        age: '',
        gender: '',
        relation_to_head: '',
        latitude: '',
        longitude: ''
      })
      toast.success('Member added successfully')
    } catch (error) {
      console.error('Failed to add member:', error)
      toast.error('Failed to add member')
    }
  }

  const toggleHousehold = (householdId) => {
    setExpandedHousehold(expandedHousehold === householdId ? null : householdId)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'offline':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getVitalStatus = (status) => {
    switch (status) {
      case 'critical':
        return 'danger'
      case 'warning':
        return 'warning'
      case 'normal':
        return 'success'
      default:
        return 'default'
    }
  }

  const getVitalStatusColor = (value, type) => {
    if (type === 'temperature') {
      if (value >= 38.0) return 'text-danger-600 dark:text-danger-400'
      if (value >= 37.5) return 'text-warning-600 dark:text-warning-400'
      return 'text-success-600 dark:text-success-400'
    }
    if (type === 'heartRate') {
      if (value >= 100 || value <= 60) return 'text-danger-600 dark:text-danger-400'
      if (value >= 90 || value <= 65) return 'text-warning-600 dark:text-warning-400'
      return 'text-success-600 dark:text-success-400'
    }
    if (type === 'bloodPressure') {
      if (value >= 140) return 'text-danger-600 dark:text-danger-400'
      if (value >= 130) return 'text-warning-600 dark:text-warning-400'
      return 'text-success-600 dark:text-success-400'
    }
    return 'text-gray-900 dark:text-white'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Households</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {households.length} household{households.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button onClick={() => setShowAddHousehold(true)}>
          <Users className="w-4 h-4 mr-2" />
          Add Household
        </Button>
      </div>

      {/* Households List */}
      <div className="space-y-4">
        {households.map((household) => (
          <Card key={household.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Household Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleHousehold(household.id)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {household.name}
                      </h3>
                      <Badge variant={getStatusColor(household.status)}>
                        {household.status}
                      </Badge>
                      <Badge variant="outline">
                        {(household.members || []).length} member{(household.members || []).length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {household.village || 'Unknown Location'}
                      </span>
                      <span className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {household.phone || 'No phone'}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Updated {format(new Date(household.createdAt), 'MMM dd, hh:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {expandedHousehold === household.id ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </div>

              {/* Household Members - Expanded */}
              {expandedHousehold === household.id && (
                <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/30">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Household Members</h4>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedHousehold(household.id)
                          setShowAddMember(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {household.members?.map((member, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {member.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {member.age} years • {member.gender} • {member.relation || 'Member'}
                                </p>
                                
                                {/* Vital Signs Display */}
                                {member.vitals && (
                                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Latest Vitals</h5>
                                    <div className="grid grid-cols-3 gap-4 text-xs">
                                      {member.vitals.temperature && (
                                        <div className="flex items-center space-x-1">
                                          <Thermometer className="w-3 h-3 text-red-500" />
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {member.vitals.temperature}°C
                                          </span>
                                        </div>
                                      )}
                                      {member.vitals.heartRate && (
                                        <div className="flex items-center space-x-1">
                                          <Heart className="w-3 h-3 text-pink-500" />
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {member.vitals.heartRate} bpm
                                          </span>
                                        </div>
                                      )}
                                      {member.vitals.bloodPressure && (
                                        <div className="flex items-center space-x-1">
                                          <Activity className="w-3 h-3 text-green-500" />
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {member.vitals.bloodPressure.systolic}/{member.vitals.bloodPressure.diastolic}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {member.vitals.lastReading && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Last: {format(new Date(member.vitals.lastReading), 'MMM dd, hh:mm a')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Badge variant={getVitalStatus(member.status || 'normal')}>
                                {member.status || 'normal'}
                              </Badge>
                            </div>

                            {/* Health Stats - simplified for now */}
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                              <p>Patient ID: {member.patientId}</p>
                              <p>Added: {format(new Date(member.createdAt), 'MMM dd, yyyy')}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Household Modal */}
      {showAddHousehold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add New Household</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddHousehold(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Household Name *
                </label>
                <Input
                  value={newHousehold.household_name}
                  onChange={(e) => setNewHousehold({...newHousehold, household_name: e.target.value})}
                  placeholder="Enter household name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Village
                </label>
                <Input
                  value={newHousehold.village}
                  onChange={(e) => setNewHousehold({...newHousehold, village: e.target.value})}
                  placeholder="Enter village name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <Input
                  value={newHousehold.phone}
                  onChange={(e) => setNewHousehold({...newHousehold, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Latitude (-90 to 90)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={newHousehold.latitude}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= -90 && value <= 90) {
                        setNewHousehold({...newHousehold, latitude: e.target.value})
                      }
                    }}
                    placeholder="-17.8252"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Longitude (-180 to 180)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={newHousehold.longitude}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= -180 && value <= 180) {
                        setNewHousehold({...newHousehold, longitude: e.target.value})
                      }
                    }}
                    placeholder="31.0335"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  onClick={handleAddHousehold}
                  disabled={!newHousehold.household_name}
                >
                  Create Household
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddHousehold(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Household Member</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMember(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <Input
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="Enter member name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Age *
                  </label>
                  <Input
                    type="number"
                    value={newMember.age}
                    onChange={(e) => setNewMember({...newMember, age: e.target.value})}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender *
                  </label>
                  <select
                    value={newMember.gender}
                    onChange={(e) => setNewMember({...newMember, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relation to Head
                </label>
                <Input
                  value={newMember.relation_to_head}
                  onChange={(e) => setNewMember({...newMember, relation_to_head: e.target.value})}
                  placeholder="e.g., Spouse, Son, Daughter"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Latitude (-90 to 90)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={newMember.latitude}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= -90 && value <= 90) {
                        setNewMember({...newMember, latitude: e.target.value})
                      }
                    }}
                    placeholder="-17.8252"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Longitude (-180 to 180)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={newMember.longitude}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= -180 && value <= 180) {
                        setNewMember({...newMember, longitude: e.target.value})
                      }
                    }}
                    placeholder="31.0335"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  onClick={handleAddMember}
                  disabled={!newMember.name || !newMember.age || !newMember.gender}
                >
                  Add Member
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddMember(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
