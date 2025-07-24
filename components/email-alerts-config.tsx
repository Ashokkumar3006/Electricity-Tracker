"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Mail,
  Settings,
  Play,
  Square,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  DollarSign,
} from "lucide-react"

interface EmailConfig {
  email_config: {
    configured: boolean
    sender_email: string
    recipient_count: number
    smtp_server: string
    smtp_port: number
  }
  monitoring: {
    is_monitoring: boolean
    thresholds: {
      peak_power: number
      daily_energy: number
      cost: number
    }
    alert_count: number
    last_check: string | null
  }
  thresholds: {
    peak_power: number
    daily_energy: number
    cost: number
  }
}

interface AlertHistory {
  alerts: Array<{
    timestamp: string
    type: string
    message: string
    status: string
    data: any
  }>
}

export default function EmailAlertsConfig() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [alertHistory, setAlertHistory] = useState<AlertHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchEmailConfig = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/email/config")
      if (!response.ok) {
        throw new Error("Failed to fetch email config")
      }
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error("Error fetching email config:", error)
      // Provide mock data for demonstration
      setConfig({
        email_config: {
          configured: false,
          sender_email: "",
          recipient_count: 0,
          smtp_server: "smtp.gmail.com",
          smtp_port: 587,
        },
        monitoring: {
          is_monitoring: false,
          thresholds: {
            peak_power: 2000,
            daily_energy: 50,
            cost: 500,
          },
          alert_count: 0,
          last_check: null,
        },
        thresholds: {
          peak_power: 2000,
          daily_energy: 50,
          cost: 500,
        },
      })
      toast({
        title: "Connection Error",
        description: "Using demo data. Please start the backend server.",
        variant: "destructive",
      })
    }
  }

  const fetchAlertHistory = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/email/alerts/history")
      if (!response.ok) {
        throw new Error("Failed to fetch alert history")
      }
      const data = await response.json()
      setAlertHistory(data)
    } catch (error) {
      console.error("Error fetching alert history:", error)
      // Provide mock data
      setAlertHistory({
        alerts: [
          {
            timestamp: new Date().toISOString(),
            type: "peak_power",
            message: "Peak power threshold exceeded",
            status: "sent",
            data: { current_power: 2500, threshold: 2000 },
          },
        ],
      })
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([fetchEmailConfig(), fetchAlertHistory()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const handleStartMonitoring = async () => {
    setActionLoading("start")
    try {
      const response = await fetch("http://localhost:5000/api/monitoring/start", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Monitoring Started",
          description: "Real-time energy monitoring is now active",
        })
        await fetchEmailConfig()
      } else {
        throw new Error(data.message || "Failed to start monitoring")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start monitoring. Please check backend connection.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleStopMonitoring = async () => {
    setActionLoading("stop")
    try {
      const response = await fetch("http://localhost:5000/api/monitoring/stop", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Monitoring Stopped",
          description: "Real-time energy monitoring has been stopped",
        })
        await fetchEmailConfig()
      } else {
        throw new Error(data.message || "Failed to stop monitoring")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop monitoring",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendTestEmail = async () => {
    setActionLoading("test")
    try {
      const response = await fetch("http://localhost:5000/api/email/test", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Test Email Sent",
          description: "Check your inbox for the test email",
        })
      } else {
        throw new Error(data.message || "Failed to send test email")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email. Check email configuration.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendManualAlert = async () => {
    setActionLoading("manual")
    try {
      const response = await fetch("http://localhost:5000/api/email/alerts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Manual alert triggered from dashboard" }),
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Manual Alert Sent",
          description: "Alert email has been sent to configured recipients",
        })
        await fetchAlertHistory()
      } else {
        throw new Error(data.message || "Failed to send manual alert")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send manual alert",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Alerts</h1>
          <p className="text-gray-600 mt-2">Configure and manage email notifications for energy alerts</p>
        </div>
        <Button onClick={loadData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Configuration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>SMTP email service status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={config?.email_config.configured ? "default" : "destructive"}>
                {config?.email_config.configured ? "Configured" : "Not Configured"}
              </Badge>
            </div>

            {config?.email_config.configured ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sender Email</span>
                  <span className="text-sm font-mono">{config.email_config.sender_email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recipients</span>
                  <span className="text-sm">{config.email_config.recipient_count} configured</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SMTP Server</span>
                  <span className="text-sm font-mono">
                    {config.email_config.smtp_server}:{config.email_config.smtp_port}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">Configure email settings in .env.local file to enable alerts</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Monitoring Status
            </CardTitle>
            <CardDescription>Real-time energy monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={config?.monitoring.is_monitoring ? "default" : "secondary"}>
                {config?.monitoring.is_monitoring ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Alerts Sent</span>
              <span className="text-sm">{config?.monitoring.alert_count || 0}</span>
            </div>

            {config?.monitoring.last_check && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Check</span>
                <span className="text-sm">{new Date(config.monitoring.last_check).toLocaleTimeString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
          <CardDescription>Current threshold settings for automatic alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <Zap className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Peak Power</p>
                <p className="text-lg font-bold text-red-700">{config?.thresholds.peak_power || 2000}W</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Daily Energy</p>
                <p className="text-lg font-bold text-blue-700">{config?.thresholds.daily_energy || 50} kWh</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Cost Limit</p>
                <p className="text-lg font-bold text-green-700">₹{config?.thresholds.cost || 500}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
          <CardDescription>Manage monitoring and send test alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {config?.monitoring.is_monitoring ? (
              <Button onClick={handleStopMonitoring} disabled={actionLoading === "stop"} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                {actionLoading === "stop" ? "Stopping..." : "Stop Monitoring"}
              </Button>
            ) : (
              <Button onClick={handleStartMonitoring} disabled={actionLoading === "start"}>
                <Play className="h-4 w-4 mr-2" />
                {actionLoading === "start" ? "Starting..." : "Start Monitoring"}
              </Button>
            )}

            <Button
              onClick={handleSendTestEmail}
              disabled={!config?.email_config.configured || actionLoading === "test"}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              {actionLoading === "test" ? "Sending..." : "Send Test Email"}
            </Button>

            <Button
              onClick={handleSendManualAlert}
              disabled={!config?.email_config.configured || actionLoading === "manual"}
              variant="outline"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {actionLoading === "manual" ? "Sending..." : "Send Manual Alert"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>Recent email alerts sent by the system</CardDescription>
        </CardHeader>
        <CardContent>
          {alertHistory?.alerts && alertHistory.alerts.length > 0 ? (
            <div className="space-y-4">
              {alertHistory.alerts.slice(0, 10).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {alert.status === "sent" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant={alert.type === "peak_power" ? "destructive" : "default"}>
                    {alert.type.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts sent yet</p>
              <p className="text-sm">Alerts will appear here when thresholds are exceeded</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
