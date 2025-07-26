"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Activity, Zap } from "lucide-react"

interface DeviceThreshold {
  setting_name: string
  threshold_value: number
  threshold_type: string
  is_enabled: boolean
}

interface DeviceAlert {
  type: string
  threshold: number
  current: number
}

interface DeviceStatus {
  current_power: number
  current_energy: number
  thresholds: DeviceThreshold[]
  alerts: DeviceAlert[]
  is_active: boolean
}

interface DeviceThresholdOverviewProps {
  connection: {
    isConnected: boolean
    status: string
    lastChecked: Date | null
  }
}

const API_BASE = "http://localhost:5000/api"

export default function DeviceThresholdOverview({ connection }: DeviceThresholdOverviewProps) {
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, DeviceStatus>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (connection.isConnected) {
      loadDeviceThresholds()
      const interval = setInterval(loadDeviceThresholds, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [connection.isConnected])

  const loadDeviceThresholds = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/device-thresholds`)
      if (response.ok) {
        const data = await response.json()
        setDeviceStatuses(data)
      }
    } catch (error) {
      console.error("Error loading device thresholds:", error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressValue = (current: number, threshold: number, type: string) => {
    if (type === "greater_than") {
      return Math.min((current / threshold) * 100, 100)
    } else if (type === "less_than") {
      return Math.max(100 - (current / threshold) * 100, 0)
    }
    return 50
  }

  const getProgressColor = (current: number, threshold: number, type: string) => {
    const isExceeded =
      (type === "greater_than" && current > threshold) ||
      (type === "less_than" && current < threshold) ||
      (type === "equal_to" && Math.abs(current - threshold) < 0.01)

    if (isExceeded) return "bg-red-500"

    const progress = getProgressValue(current, threshold, type)
    if (progress > 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (!connection.isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Backend Not Connected</h3>
          <p className="text-gray-600">Please ensure the backend server is running to view device thresholds.</p>
        </div>
      </div>
    )
  }

  if (loading && Object.keys(deviceStatuses).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading device thresholds...</p>
        </div>
      </div>
    )
  }

  const deviceNames = Object.keys(deviceStatuses)

  if (deviceNames.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Device Data</h3>
          <p className="text-gray-600">Upload energy data to see device threshold monitoring.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Device Threshold Overview</h2>
        <p className="text-gray-600 mt-2">Monitor real-time device status against configured thresholds</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deviceNames.map((deviceName) => {
          const device = deviceStatuses[deviceName]
          const hasAlerts = device.alerts.length > 0
          const hasThresholds = device.thresholds.length > 0

          return (
            <Card key={deviceName} className={`${hasAlerts ? "border-red-200 bg-red-50" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className={`h-5 w-5 ${device.is_active ? "text-green-500" : "text-gray-400"}`} />
                    {deviceName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {hasAlerts && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    <Badge variant={device.is_active ? "default" : "secondary"}>
                      {device.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Current: {device.current_power.toFixed(1)}W • {device.current_energy.toFixed(2)}kWh
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {hasAlerts && (
                  <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Active Alerts
                    </h4>
                    <div className="space-y-2">
                      {device.alerts.map((alert, index) => (
                        <div key={index} className="text-sm text-red-700">
                          <span className="font-medium">{alert.type.replace("_", " ").toUpperCase()}:</span>{" "}
                          {alert.current.toFixed(1)} exceeds {alert.threshold}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasThresholds ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Configured Thresholds</h4>
                    {device.thresholds.map((threshold, index) => {
                      const currentValue = threshold.setting_name.includes("power")
                        ? device.current_power
                        : device.current_energy
                      const unit = threshold.setting_name.includes("power") ? "W" : "kWh"
                      const progressValue = getProgressValue(
                        currentValue,
                        threshold.threshold_value,
                        threshold.threshold_type,
                      )

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">{threshold.setting_name.replace("_", " ")}</span>
                            <span className="text-gray-600">
                              {currentValue.toFixed(1)} / {threshold.threshold_value} {unit}
                            </span>
                          </div>
                          <div className="relative">
                            <Progress value={progressValue} className="h-2" />
                            <div
                              className={`absolute top-0 h-2 rounded-full transition-all ${getProgressColor(
                                currentValue,
                                threshold.threshold_value,
                                threshold.threshold_type,
                              )}`}
                              style={{ width: `${progressValue}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{threshold.threshold_type.replace("_", " ")}</span>
                            <Badge variant="outline" className="text-xs">
                              {threshold.is_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No thresholds configured</p>
                    <p className="text-xs">Device uses global settings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            Refreshing device status...
          </div>
        </div>
      )}
    </div>
  )
}
