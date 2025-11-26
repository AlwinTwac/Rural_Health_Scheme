import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Activity,
  Wifi,
  Cpu,
  HardDrive,
  Battery,
  Signal,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { statsAPI, deviceAPI } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export function SystemHealth() {
  const [systemStatus, setSystemStatus] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSystemHealth()
    const interval = setInterval(loadSystemHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadSystemHealth = async () => {
    try {
      const [status, devicesData] = await Promise.all([
        statsAPI.getSystemHealth(),
        deviceAPI.getAll()
      ])
      setSystemStatus(status)
      setDevices(devicesData)
    } catch (error) {
      console.error('Failed to load system health:', error)
      // Use mock data
      setSystemStatus(getMockSystemStatus())
      setDevices(getMockDevices())
    } finally {
      setLoading(false)
    }
  }

  const getMockSystemStatus = () => ({
    network: {
      status: 'online',
      activeNodes: 42,
      totalNodes: 45,
      signalStrength: 85,
      packetLoss: 0.2,
      latency: 45,
    },
    hub: {
      cpuUsage: 32,
      memoryUsage: 58,
      diskUsage: 45,
      temperature: 42,
      uptime: 432000, // 5 days in seconds
    },
    power: {
      batteryLevel: 78,
      solarCharging: true,
      estimatedRuntime: 18,
    },
    lastUpdate: new Date(),
  })

  const getMockDevices = () => [
    {
      id: 'D001',
      householdId: 'H001',
      householdName: 'Household A',
      status: 'online',
      batteryLevel: 85,
      signalStrength: 92,
      lastSeen: new Date(Date.now() - 120000),
      firmwareVersion: '1.2.3',
    },
    {
      id: 'D002',
      householdId: 'H002',
      householdName: 'Household B',
      status: 'online',
      batteryLevel: 45,
      signalStrength: 78,
      lastSeen: new Date(Date.now() - 300000),
      firmwareVersion: '1.2.3',
    },
    {
      id: 'D003',
      householdId: 'H003',
      householdName: 'Household C',
      status: 'offline',
      batteryLevel: 12,
      signalStrength: 0,
      lastSeen: new Date(Date.now() - 3600000),
      firmwareVersion: '1.2.2',
    },
  ]

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}d ${hours}h`
  }

  const getStatusColor = (status) => {
    return status === 'online' ? 'success' : 'danger'
  }

  const getSignalColor = (strength) => {
    if (strength >= 70) return 'success'
    if (strength >= 40) return 'warning'
    return 'danger'
  }

  const getBatteryColor = (level) => {
    if (level >= 50) return 'success'
    if (level >= 20) return 'warning'
    return 'danger'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const status = systemStatus || getMockSystemStatus()
  const deviceList = devices.length > 0 ? devices : getMockDevices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600 mt-1">
            Monitor network, devices, and hub status
          </p>
        </div>
        <Button onClick={loadSystemHealth}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mesh Network Status</CardTitle>
              <CardDescription>Zigbee network health and connectivity</CardDescription>
            </div>
            <Badge variant={status.network.status === 'online' ? 'success' : 'danger'}>
              {status.network.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Wifi className="w-5 h-5 text-primary-600" />
                <Badge variant="info">{status.network.activeNodes}/{status.network.totalNodes}</Badge>
              </div>
              <p className="text-sm text-gray-600">Active Nodes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round((status.network.activeNodes / status.network.totalNodes) * 100)}%
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Signal className="w-5 h-5 text-success-600" />
                <Badge variant="success">{status.network.signalStrength}%</Badge>
              </div>
              <p className="text-sm text-gray-600">Signal Strength</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Excellent</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-sm text-gray-600">Packet Loss</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {status.network.packetLoss}%
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-sm text-gray-600">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {status.network.latency}ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hub Status */}
        <Card>
          <CardHeader>
            <CardTitle>Central Hub Status</CardTitle>
            <CardDescription>Computer and system resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center">
                  <Cpu className="w-4 h-4 mr-2" />
                  CPU Usage
                </span>
                <span className="text-sm font-semibold">{status.hub.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${status.hub.cpuUsage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Memory Usage
                </span>
                <span className="text-sm font-semibold">{status.hub.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-warning-600 h-2 rounded-full transition-all"
                  style={{ width: `${status.hub.memoryUsage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center">
                  <HardDrive className="w-4 h-4 mr-2" />
                  Disk Usage
                </span>
                <span className="text-sm font-semibold">{status.hub.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-success-600 h-2 rounded-full transition-all"
                  style={{ width: `${status.hub.diskUsage}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Temperature</p>
                  <p className="font-semibold">{status.hub.temperature}°C</p>
                </div>
                <div>
                  <p className="text-gray-600">Uptime</p>
                  <p className="font-semibold">{formatUptime(status.hub.uptime)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Power Status */}
        <Card>
          <CardHeader>
            <CardTitle>Power Status</CardTitle>
            <CardDescription>Battery and solar charging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 bg-gradient-to-br from-success-50 to-success-100 rounded-lg">
              <Battery className="w-12 h-12 text-success-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Battery Level</p>
              <p className="text-4xl font-bold text-success-700">
                {status.power.batteryLevel}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                ~{status.power.estimatedRuntime} hours remaining
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-warning-600" />
                <div>
                  <p className="font-medium text-gray-900">Solar Charging</p>
                  <p className="text-sm text-gray-500">
                    {status.power.solarCharging ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <Badge variant={status.power.solarCharging ? 'success' : 'warning'}>
                {status.power.solarCharging ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices List */}
      <Card>
        <CardHeader>
          <CardTitle>Household Devices</CardTitle>
          <CardDescription>Status of all registered devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deviceList.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    device.status === 'online' ? 'bg-success-100' : 'bg-gray-100'
                  }`}>
                    <Activity className={`w-5 h-5 ${
                      device.status === 'online' ? 'text-success-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{device.householdName}</h4>
                    <p className="text-sm text-gray-500">
                      Device ID: {device.id} • v{device.firmwareVersion}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Signal className="w-4 h-4 text-gray-400" />
                      <Badge variant={getSignalColor(device.signalStrength)} size="sm">
                        {device.signalStrength}%
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Battery className="w-4 h-4 text-gray-400" />
                      <Badge variant={getBatteryColor(device.batteryLevel)} size="sm">
                        {device.batteryLevel}%
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(device.status)}>
                    {device.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
