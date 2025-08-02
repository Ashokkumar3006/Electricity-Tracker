"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Send, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AlertSetting {
  id: number
  setting_name: string
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

interface ConnectionState {
  isConnected: boolean
  status: string
  lastChecked: Date | null
}

interface AlertManagementProps {
  connection: ConnectionState
}

const API_BASE = "http://localhost:5000/api"

export default function AlertManagement({ connection }: AlertManagementProps) {
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([])
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([])
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // New alert setting form
  const [newSetting, setNewSetting] = useState({
    setting_name: "",
    threshold_value: "",
    threshold_type: "greater_than",
    is_enabled: true,
  })

  // New email recipient form
  const [newRecipient, setNewRecipient] = useState({
    email: "",
    name: "",
    alert_types: ["peak_power", "energy_spike", "device_anomaly"],
  })

  // Test email form
  const [testEmail, setTestEmail] = useState("")

  // Add this new state and function after the existing state declarations
  const [connectionStatus, setConnectionStatus] = useState<{
    testing: boolean
    result: any
  }>({ testing: false, result: null })

  useEffect(() => {
    if (connection.isConnected) {
      loadAlertSettings()
      loadEmailRecipients()
      loadAlertHistory()
    }
  }, [connection.isConnected])

  const loadAlertSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/alert-settings`)
      if (response.ok) {
        const data = await response.json()
        setAlertSettings(data)
      }
    } catch (error) {
      console.error("Error loading alert settings:", error)
      toast({
        title: "Error",
        description: "Failed to load alert settings",
        variant: "destructive",
      })
    }
  }

  const loadEmailRecipients = async () => {
    try {
      const response = await fetch(`${API_BASE}/email-recipients`)
      if (response.ok) {
        const data = await response.json()
        setEmailRecipients(data)
      }
    } catch (error) {
      console.error("Error loading email recipients:", error)
      toast({
        title: "Error",
        description: "Failed to load email recipients",
        variant: "destructive",
      })
    }
  }

  const loadAlertHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/alert-history`)
      if (response.ok) {
        const data = await response.json()
        setAlertHistory(data.alerts || [])
      }
    } catch (error) {
      console.error("Error loading alert history:", error)
      toast({
        title: "Error",
        description: "Failed to load alert history",
        variant: "destructive",
      })
    }
  }

  const handleAddAlertSetting = async () => {
    if (!newSetting.setting_name || !newSetting.threshold_value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/alert-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newSetting,
          threshold_value: Number.parseFloat(newSetting.threshold_value),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Alert setting added successfully",
        })
        setNewSetting({
          setting_name: "",
          threshold_value: "",
          threshold_type: "greater_than",
          is_enabled: true,
        })
        loadAlertSettings()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add alert setting")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add alert setting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAlertSetting = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/alert-settings/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Alert setting deleted successfully",
        })
        loadAlertSettings()
      } else {
        throw new Error("Failed to delete alert setting")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete alert setting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmailRecipient = async () => {
    if (!newRecipient.email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/email-recipients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRecipient),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email recipient added successfully",
        })
        setNewRecipient({
          email: "",
          name: "",
          alert_types: ["peak_power", "energy_spike", "device_anomaly"],
        })
        loadEmailRecipients()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add email recipient")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add email recipient",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmailRecipient = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/email-recipients/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email recipient deleted successfully",
        })
        loadEmailRecipients()
      } else {
        throw new Error("Failed to delete email recipient")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete email recipient",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestAlert = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/test-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: testEmail }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test alert sent successfully",
        })
        setTestEmail("")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to send test alert")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test alert",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add this function after the existing functions
  const handleTestConnection = async () => {
    setConnectionStatus({ testing: true, result: null })

    try {
      const response = await fetch(`${API_BASE}/test-email-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      setConnectionStatus({ testing: false, result })

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus({ testing: false, result: null })
      toast({
        title: "Error",
        description: "Failed to test email connection",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getSeverityColor = (alertType: string) => {
    switch (alertType) {
      case "peak_power":
        return "bg-red-100 text-red-800"
      case "energy_spike":
        return "bg-orange-100 text-orange-800"
      case "device_anomaly":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!connection.isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Backend Not Connected</h3>
          <p className="text-gray-600">Please ensure the backend server is running to manage alerts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alert Management</h1>
        <p className="text-gray-600 mt-2">Configure energy monitoring alerts and email notifications</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Alert Settings</TabsTrigger>
          <TabsTrigger value="recipients">Email Recipients</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
          <TabsTrigger value="test">Test Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Alert Setting</CardTitle>
              <CardDescription>Configure thresholds for different types of energy alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="setting-name">Alert Name</Label>
                  <Select
                    value={newSetting.setting_name}
                    onValueChange={(value) => setNewSetting({ ...newSetting, setting_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peak_power">Peak Power</SelectItem>
                      <SelectItem value="energy_spike">Energy Spike</SelectItem>
                      <SelectItem value="device_anomaly">Device Anomaly</SelectItem>
                      <SelectItem value="daily_consumption">Daily Consumption</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="threshold-value">Threshold Value</Label>
                  <Input
                    id="threshold-value"
                    type="number"
                    placeholder="Enter threshold"
                    value={newSetting.threshold_value}
                    onChange={(e) => setNewSetting({ ...newSetting, threshold_value: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="threshold-type">Condition</Label>
                  <Select
                    value={newSetting.threshold_type}
                    onValueChange={(value) => setNewSetting({ ...newSetting, threshold_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="equal_to">Equal To</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddAlertSetting} disabled={loading} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Setting
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Alert Settings</CardTitle>
              <CardDescription>Manage your active alert configurations</CardDescription>
            </CardHeader>
            <CardContent>
              {alertSettings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No alert settings configured yet</div>
              ) : (
                <div className="space-y-4">
                  {alertSettings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={setting.is_enabled}
                          onCheckedChange={() => {
                            // Handle toggle enable/disable
                          }}
                        />
                        <div>
                          <h4 className="font-medium capitalize">{setting.setting_name.replace("_", " ")}</h4>
                          <p className="text-sm text-gray-600">
                            {setting.threshold_type.replace("_", " ")} {setting.threshold_value}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={setting.is_enabled ? "default" : "secondary"}>
                          {setting.is_enabled ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAlertSetting(setting.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Email Recipient</CardTitle>
              <CardDescription>Add people who should receive energy alert notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient-email">Email Address</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="Enter email address"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="recipient-name">Name (Optional)</Label>
                  <Input
                    id="recipient-name"
                    placeholder="Enter name"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Alert Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["peak_power", "energy_spike", "device_anomaly"].map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newRecipient.alert_types.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRecipient({
                              ...newRecipient,
                              alert_types: [...newRecipient.alert_types, type],
                            })
                          } else {
                            setNewRecipient({
                              ...newRecipient,
                              alert_types: newRecipient.alert_types.filter((t) => t !== type),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddEmailRecipient} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Recipients</CardTitle>
              <CardDescription>People who will receive alert notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {emailRecipients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No email recipients configured yet</div>
              ) : (
                <div className="space-y-4">
                  {emailRecipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{recipient.name || recipient.email}</h4>
                        <p className="text-sm text-gray-600">{recipient.email}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recipient.alert_types.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={recipient.is_active ? "default" : "secondary"}>
                          {recipient.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmailRecipient(recipient.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>View all sent alerts and their delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              {alertHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No alerts have been sent yet</div>
              ) : (
                <div className="space-y-4">
                  {alertHistory.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(alert.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(alert.alert_type)}>
                              {alert.alert_type.replace("_", " ")}
                            </Badge>
                            <span className="font-medium">{alert.device_name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Sent to {alert.recipients_sent.length} recipient(s) •{" "}
                            {new Date(alert.sent_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {alert.actual_value} / {alert.threshold_value}
                        </div>
                        <Badge variant={alert.status === "sent" ? "default" : "destructive"}>{alert.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Connection Test</CardTitle>
              <CardDescription>Test your SMTP connection before sending alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleTestConnection}
                disabled={connectionStatus.testing}
                variant="outline"
                className="w-full bg-transparent"
              >
                {connectionStatus.testing ? "Testing Connection..." : "Test Email Connection"}
              </Button>

              {connectionStatus.result && (
                <div
                  className={`p-4 rounded-lg border ${
                    connectionStatus.result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {connectionStatus.result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span
                      className={`font-medium ${connectionStatus.result.success ? "text-green-800" : "text-red-800"}`}
                    >
                      {connectionStatus.result.success ? "Connection Successful" : "Connection Failed"}
                    </span>
                  </div>

                  {connectionStatus.result.error && (
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        <strong>Error:</strong> {connectionStatus.result.error}
                      </p>
                      {connectionStatus.result.help && (
                        <p className="mt-1">
                          <strong>Help:</strong> {connectionStatus.result.help}
                        </p>
                      )}
                    </div>
                  )}

                  {connectionStatus.result.message && (
                    <p className="mt-2 text-sm text-green-700">{connectionStatus.result.message}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Test Alert</CardTitle>
              <CardDescription>Send a test email to verify your alert configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="Enter email address to test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleSendTestAlert} disabled={loading || !testEmail}>
                <Send className="h-4 w-4 mr-2" />
                Send Test Alert
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Gmail Setup Instructions</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>
                    <strong>Step 1:</strong> Enable 2-Factor Authentication on your Gmail account
                  </p>
                  <p>
                    <strong>Step 2:</strong> Generate an App Password:
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>
                      • Go to{" "}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Google App Passwords
                      </a>
                    </li>
                    <li>• Select "Mail" as the app</li>
                    <li>• Copy the 16-character password</li>
                  </ul>
                  <p>
                    <strong>Step 3:</strong> Update your .env file:
                  </p>
                  <div className="bg-blue-100 p-2 rounded font-mono text-xs mt-2">
                    SENDER_EMAIL=your-email@gmail.com
                    <br />
                    SENDER_PASSWORD=your-16-char-app-password
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
