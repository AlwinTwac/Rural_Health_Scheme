import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Users, 
  Bell, 
  CheckCircle, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Activity,
  Heart,
  Thermometer
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '@/store/useStore'
import { statsAPI, requestAPI } from '@/lib/api'
import { formatTime, getSeverityColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export function Dashboard() {
  const { dashboardStats, setDashboardStats, activeRequests, setActiveRequests } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [stats, requests] = await Promise.all([
        statsAPI.getDashboard(),
        requestAPI.getActive()
      ])
      setDashboardStats(stats)
      setActiveRequests(requests)
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for demo
  const mockStats = dashboardStats || {
    totalPatients: 45,
    activeRequests: 3,
    completedToday: 8,
    avgResponseTime: 12,
    criticalAlerts: 1,
    networkDevices: 42,
    weeklyTrend: [
      { day: 'Mon', requests: 12 },
      { day: 'Tue', requests: 15 },
      { day: 'Wed', requests: 8 },
      { day: 'Thu', requests: 14 },
      { day: 'Fri', requests: 10 },
      { day: 'Sat', requests: 6 },
      { day: 'Sun', requests: 4 },
    ],
    vitalsTrend: [
      { time: '00:00', temp: 36.8, hr: 72 },
      { time: '04:00', temp: 36.6, hr: 68 },
      { time: '08:00', temp: 37.0, hr: 75 },
      { time: '12:00', temp: 37.2, hr: 80 },
      { time: '16:00', temp: 37.1, hr: 78 },
      { time: '20:00', temp: 36.9, hr: 74 },
    ],
  }

  const mockRequests = activeRequests.length > 0 ? activeRequests : [
    {
      id: 1,
      patientName: 'John Doe',
      household: 'Household A',
      severity: 'critical',
      symptoms: 'High fever, difficulty breathing',
      vitals: { temperature: 39.2, heartRate: 105, bloodPressure: '140/90' },
      timestamp: new Date(Date.now() - 300000),
      distance: 2.3,
    },
    {
      id: 2,
      patientName: 'Mary Smith',
      household: 'Household B',
      severity: 'high',
      symptoms: 'Persistent cough, chest pain',
      vitals: { temperature: 37.8, heartRate: 88, bloodPressure: '130/85' },
      timestamp: new Date(Date.now() - 600000),
      distance: 4.1,
    },
    {
      id: 3,
      patientName: 'Peter Johnson',
      household: 'Household C',
      severity: 'medium',
      symptoms: 'Headache, nausea',
      vitals: { temperature: 37.2, heartRate: 76, bloodPressure: '120/80' },
      timestamp: new Date(Date.now() - 900000),
      distance: 1.8,
    },
  ]

  const StatCard = ({ title, value, icon: Icon, trend, gradient, change }) => (
    <Card className="group hover:scale-105 transition-transform duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          {change && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
              <span className="text-xs font-semibold">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-gray-600 dark:text-gray-200 mt-2">{trend}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid - Enhanced with gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={mockStats.totalPatients}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
          change={12}
          trend="Active in system"
        />
        <StatCard
          title="Active Requests"
          value={mockStats.activeRequests}
          icon={Bell}
          gradient="from-orange-500 to-pink-500"
          change={-5}
          trend="Awaiting response"
        />
        <StatCard
          title="Completed Today"
          value={mockStats.completedToday}
          icon={CheckCircle}
          gradient="from-green-500 to-emerald-500"
          change={18}
          trend="Successfully resolved"
        />
        <StatCard
          title="Avg Response"
          value={`${mockStats.avgResponseTime}m`}
          icon={Clock}
          gradient="from-purple-500 to-pink-500"
          change={8}
          trend="Response time"
        />
      </div>

      {/* Active Requests & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Requests - Enhanced */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <span>Active Requests</span>
                </CardTitle>
                <CardDescription>Prioritized by severity and time</CardDescription>
              </div>
              <Button size="sm" onClick={() => window.location.href = '/requests'} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockRequests.map((request) => (
                <div
                  key={request.id}
                  className="group relative p-5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50"
                >
                  {/* Severity indicator */}
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20 ${
                    request.severity === 'critical' ? 'bg-red-500' :
                    request.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`} />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{request.patientName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{request.household}</p>
                      </div>
                      <Badge variant={getSeverityColor(request.severity)} className="uppercase text-xs">
                        {request.severity}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-4 line-clamp-2">{request.symptoms}</p>
                    
                    {/* Vitals */}
                    <div className="flex items-center space-x-3 mb-3 text-xs">
                      <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                        <Thermometer className="w-3 h-3" />
                        <span className="font-medium">{request.vitals.temperature}°C</span>
                      </div>
                      <div className="flex items-center space-x-1 text-pink-600 dark:text-pink-400">
                        <Heart className="w-3 h-3" />
                        <span className="font-medium">{request.vitals.heartRate} bpm</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 pt-3 border-t border-gray-200 dark:border-white/10">
                      <span className="flex items-center font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(request.timestamp)}
                      </span>
                      <span className="font-semibold">{request.distance} km</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Requests Trend - Enhanced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span>Weekly Activity</span>
            </CardTitle>
            <CardDescription>Request volume over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockStats.weeklyTrend}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="requests" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Vitals Trend - Enhanced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-400" />
              <span>Health Trends</span>
            </CardTitle>
            <CardDescription>Average vital signs over 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockStats.vitalsTrend}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis yAxisId="left" stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temp"
                  stroke="url(#tempGradient)"
                  strokeWidth={3}
                  name="Temperature (°C)"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hr"
                  stroke="url(#hrGradient)"
                  strokeWidth={3}
                  name="Heart Rate (bpm)"
                  dot={{ fill: '#06b6d4', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Status */}
        <Card className="hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">Mesh Network</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Online</p>
                <p className="text-xs text-gray-600 dark:text-gray-200 mt-1">All nodes connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Devices */}
        <Card className="hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{mockStats.networkDevices}</p>
                <p className="text-xs text-gray-600 dark:text-gray-200 mt-1">Connected to network</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card className="hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">Critical Alerts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{mockStats.criticalAlerts}</p>
                <p className="text-xs text-gray-600 dark:text-gray-200 mt-1">Requires attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
