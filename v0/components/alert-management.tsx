"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus, TestTube, Zap, Mail, Settings, ComputerIcon as Device } from "lucide-react"

interface AlertSetting {
  id: number
  setting_name: string
  device_name?: string
  threshold_value: number
  threshold_type: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

interface EmailRecipient {
  id: number
  email: string
  name: string
  is_active: boolean
  alert_types: string[]
  created_at: string
}

interface AlertHistory {
  id: number
  alert_type: string
  device_name: string
  threshold_value: number
  actual_value: number
  message: string
  recipients_sent: string[]
  sent_at: string
  status: string
}

const ALERT_TYPES = [
  { value: "peak_power", label: "Peak Power", description: "Power consumption exceeds threshold" },
  { value: "energy_spike", label: "Energy Spike", description: "Sudden increase in energy consumption" },
  { value: "device_anomaly", label: "Device Anomaly", description: "Unusual device behavior detected" },
  { value: "voltage_limit", label: "Voltage Limit", description: "Voltage exceeds safe threshold" },
  { value: "current_limit", label: "Current Limit", description: "Current exceeds safe threshold" },
  { value: "energy_limit", label: "Energy Limit", description: "Energy consumption exceeds daily limit" },
]

const THRESHOLD_TYPES = [
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "equals", label: "Equals" },
]

export default function AlertManagement() {
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([])
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([])
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([])
  const [devices, setDevices] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form states
  const [newAlert, setNewAlert] = useState({
    setting_name: ALERT_TYPES[0].value,
    device_name: "",
    threshold_value: 0,
    threshold_type: "greater_than",
    is_enabled: true,
  })

  const [newRecipient, setNewRecipient] = useState({
    email: "",
    name: "",
    alert_types: ["peak_power", "energy_spike", "device_anomaly"],
  })

  const [testEmail, setTestEmail] = useState("")
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [settingsRes, recipientsRes, historyRes, devicesRes] = await Promise.all([
        fetch("/api/alert-settings"),
        fetch("/api/email-recipients"),
        fetch("/api/alert-history"),
        fetch("/api/devices/list"),
      ])

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setAlertSettings(settings)
      }

      if (recipientsRes.ok) {
        const recipients = await recipientsRes.json()
        setEmailRecipients(recipients)
      }

      if (historyRes.ok) {
        const history = await historyRes.json()
        setAlertHistory(history.alerts || [])
      }

      if (devicesRes.ok) {
        const devicesList = await devicesRes.json()
        setDevices(devicesList.devices || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setMessage({ type: "error", text: "Failed to fetch data" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const alertData = {
        ...newAlert,
        device_name: newAlert.device_name || null, // Convert empty string to null for global alerts
      }

      const response = await fetch("/api/alert-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertData),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Alert setting created successfully" })
        setNewAlert({
          setting_name: ALERT_TYPES[0].value,
          device_name: "",
          threshold_value: 0,
          threshold_type: "greater_than",
          is_enabled: true,
        })
        fetchData()
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Failed to create alert setting" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create alert setting" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAlert = async (id: number) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/alert-settings/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Alert setting deleted successfully" })
        fetchData()
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Failed to delete alert setting" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete alert setting" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRecipient = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const response = await fetch("/api/email-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipient),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Email recipient added successfully" })
        setNewRecipient({
          email: "",
          name: "",
          alert_types: ["peak_power", "energy_spike", "device_anomaly"],
        })
        fetchData()
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Failed to add email recipient" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add email recipient" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecipient = async (id: number) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/email-recipients/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Email recipient deleted successfully" })
        fetchData()
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Failed to delete email recipient" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete email recipient" })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setLoading(true)
      setConnectionTestResult(null)

      const response = await fetch("/api/test-email-connection", {
        method: "POST",
      })

      const result = await response.json()
      setConnectionTestResult(result)

      if (result.success) {
        setMessage({ type: "success", text: "Email connection test successful!" })
      } else {
        setMessage({ type: "error", text: `Connection test failed: ${result.error}` })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to test email connection" })
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestAlert = async () => {
    if (!testEmail) {
      setMessage({ type: "error", text: "Please enter an email address" })
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/test-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Test alert sent successfully!" })
        setTestEmail("")
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Failed to send test alert" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send test alert" })
    } finally {
      setLoading(false)
    }
  }

  const handleAlertTypeToggle = (alertType: string, checked: boolean) => {
    setNewRecipient((prev) => ({
      ...prev,
      alert_types: checked ? [...prev.alert_types, alertType] : prev.alert_types.filter((type) => type !== alertType),
    }))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getAlertTypeLabel = (type: string) => {
    const alertType = ALERT_TYPES.find((at) => at.value === type)
    return alertType ? alertType.label : type
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
          <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Alert Settings
          </TabsTrigger>
          <TabsTrigger value="recipients" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Device className="h-5 w-5" />
                Create Alert Setting
              </CardTitle>
              <CardDescription>Set up thresholds for global monitoring or specific devices</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alert-type">Alert Type</Label>
                    <Select
                      value={newAlert.setting_name}
                      onValueChange={(value) => setNewAlert((prev) => ({ ...prev, setting_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select alert type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALERT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="device">Device (Optional)</Label>
                    <Select
                      value={newAlert.device_name}
                      onValueChange={(value) => setNewAlert((prev) => ({ ...prev, device_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select device or leave empty for global" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Global (All Devices)</SelectItem>
                        {devices.map((device) => (
                          <SelectItem key={device} value={device}>
                            {device}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="threshold">Threshold Value</Label>
                    <Input
                      id="threshold"
                      type="number"
                      step="0.1"
                      value={newAlert.threshold_value}
                      onChange={(e) =>
                        setNewAlert((prev) => ({ ...prev, threshold_value: Number.parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="Enter threshold value"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="threshold-type">Threshold Type</Label>
                    <Select
                      value={newAlert.threshold_type}
                      onValueChange={(value) => setNewAlert((prev) => ({ ...prev, threshold_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THRESHOLD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={newAlert.is_enabled}
                    onCheckedChange={(checked) => setNewAlert((prev) => ({ ...prev, is_enabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable Alert</Label>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert Setting
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Alert Settings</CardTitle>
              <CardDescription>Manage your existing alert configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertSettings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No alert settings configured</p>
                ) : (
                  alertSettings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{getAlertTypeLabel(setting.setting_name)}</Badge>
                          {setting.device_name && (
                            <Badge variant="secondary">
                              <Device className="h-3 w-3 mr-1" />
                              {setting.device_name}
                            </Badge>
                          )}
                          {!setting.device_name && <Badge variant="default">Global</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">
                          Threshold: {setting.threshold_value} ({setting.threshold_type.replace("_", " ")})
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(setting.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.is_enabled}
                          onCheckedChange={() => {
                            // Handle toggle enable/disable
                            // You can implement this functionality
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAlert(setting.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Email Recipient</CardTitle>
              <CardDescription>Add recipients who will receive alert notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRecipient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newRecipient.email}
                      onChange={(e) => setNewRecipient((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      value={newRecipient.name}
                      onChange={(e) => setNewRecipient((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Alert Types</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {ALERT_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Switch
                          id={type.value}
                          checked={newRecipient.alert_types.includes(type.value)}
                          onCheckedChange={(checked) => handleAlertTypeToggle(type.value, checked)}
                        />
                        <Label htmlFor={type.value} className="text-sm">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Recipients</CardTitle>
              <CardDescription>Manage recipients who receive alert notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailRecipients.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No email recipients configured</p>
                ) : (
                  emailRecipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{recipient.email}</span>
                          {recipient.name && <span className="text-sm text-gray-500">({recipient.name})</span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {recipient.alert_types.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {getAlertTypeLabel(type)}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Added: {new Date(recipient.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={recipient.is_active}
                          onCheckedChange={() => {
                            // Handle toggle active/inactive
                            // You can implement this functionality
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRecipient(recipient.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>View recent alert notifications and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No alert history available</p>
                ) : (
                  alertHistory.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getAlertTypeLabel(alert.alert_type)}</Badge>
                          <Badge variant="secondary">
                            <Device className="h-3 w-3 mr-1" />
                            {alert.device_name}
                          </Badge>
                          <Badge className={`text-white ${alert.status === "sent" ? "bg-green-500" : "bg-red-500"}`}>
                            {alert.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">{new Date(alert.sent_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <div className="text-xs text-gray-500">
                        <p>
                          Threshold: {alert.threshold_value} | Actual: {alert.actual_value}
                        </p>
                        <p>Recipients: {alert.recipients_sent.join(", ")}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Email Connection</CardTitle>
              <CardDescription>Test your email configuration before setting up alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleTestConnection} disabled={loading} className="w-full">
                <TestTube className="h-4 w-4 mr-2" />
                Test Email Connection
              </Button>

              {connectionTestResult && (
                <div
                  className={`p-4 rounded-lg ${connectionTestResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}
                >
                  <h4 className={`font-medium ${connectionTestResult.success ? "text-green-800" : "text-red-800"}`}>
                    {connectionTestResult.success ? "Connection Successful!" : "Connection Failed"}
                  </h4>
                  <p className={`text-sm mt-1 ${connectionTestResult.success ? "text-green-700" : "text-red-700"}`}>
                    {connectionTestResult.message || connectionTestResult.error}
                  </p>

                  {connectionTestResult.troubleshooting && (
                    <div className="mt-3">
                      <h5 className="font-medium text-red-800 mb-2">Troubleshooting Steps:</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {connectionTestResult.troubleshooting.map((step: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Test Alert</CardTitle>
              <CardDescription>Send a test alert email to verify the complete system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address for test"
                />
              </div>
              <Button onClick={handleSendTestAlert} disabled={loading || !testEmail} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Test Alert
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
