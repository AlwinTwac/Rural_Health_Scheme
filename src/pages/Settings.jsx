import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Settings as SettingsIcon, Save } from 'lucide-react'

export function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Hub Name" defaultValue="Central Hub - Zimbabwe" />
          <Input label="Location" defaultValue="Rural Village Center" />
          <Select label="Time Zone">
            <option>Africa/Harare (UTC+2)</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Zigbee Channel" type="number" defaultValue="15" />
          <Input label="Network ID" defaultValue="RURAL_HEALTH_001" />
        </CardContent>
      </Card>

      <Button variant="primary">
        <Save className="w-4 h-4 mr-2" />
        Save Settings
      </Button>
    </div>
  )
}
