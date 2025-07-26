"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  AirVent,
  Refrigerator,
  Tv,
  Lightbulb,
  Fan,
  Zap,
  AlertCircle,
  BarChart3,
  LightbulbIcon as BulbIcon,
  TrendingUp,
  Loader2,
  CalendarDays,
  Clock,
} from "lucide-react"
import ProfessionalChart from "@/components/professional-chart"

interface DeviceMonitoringProps {
  deviceData: any
  connection: any
  onTabChange: (tab: string) => void // Add this prop
}

interface DeviceDetails {
  device_name: string
  current_power: number
  total_energy: number
  peak_usage: number
  average_power: number
  efficiency: number
  is_active: boolean
  hourly_usage: { [hour: string]: number }
  daily_usage: { [date: string]: number }
  suggestions: string[]
  data_points: number
  predicted_kwh: number
  predicted_bill: {
    total_amount: number
    breakup: any[]
  } | null
}

const deviceIcons = {
  AC: AirVent,
  Fridge: Refrigerator,
  Television: Tv,
  "Washing Machine": Zap, // Using Zap for general appliance
  Light: Lightbulb,
  Fan: Fan,
}

const deviceColors = {
  AC: "blue",
  Fridge: "green",
  Television: "purple",
  "Washing Machine": "orange",
  Light: "yellow",
  Fan: "cyan",
}

export default function DeviceMonitoring({ deviceData, connection, onTabChange }: DeviceMonitoringProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [selectedDeviceDetails, setSelectedDeviceDetails] = useState<DeviceDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const devices = Object.entries(deviceData)

  const fetchDeviceDetails = useCallback(async (deviceName: string) => {
    setIsLoadingDetails(true)
    try {
      const response = await fetch(`http://localhost:5000/api/device/${deviceName}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch details for ${deviceName}`)
      }
      const data: DeviceDetails = await response.json()
      setSelectedDeviceDetails(data)
    } catch (error) {
      console.error("Error fetching device details:", error)
      setSelectedDeviceDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDevice && connection.isConnected) {
      fetchDeviceDetails(selectedDevice)
    } else {
      setSelectedDeviceDetails(null)
    }
  }, [selectedDevice, connection.isConnected, fetchDeviceDetails])

  if (devices.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Monitoring</h1>
          <p className="text-gray-600">Monitor individual device performance and get AI-powered recommendations</p>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2 text-gray-500">No device data available</h3>
            <p className="text-sm text-gray-400 mb-6">Upload energy data to start monitoring your devices</p>
            <Button variant="outline" onClick={() => onTabChange("upload")}>
              Upload Data
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Device Monitoring</h1>
        <p className="text-gray-600">Monitor individual device performance and get AI-powered recommendations</p>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(([deviceName, data]: [string, any]) => {
          const IconComponent = deviceIcons[deviceName as keyof typeof deviceIcons] || Zap
          const color = deviceColors[deviceName as keyof typeof deviceColors] || "gray"

          return (
            <Card
              key={deviceName}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedDevice === deviceName ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedDevice(deviceName)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg text-${color}-600 bg-${color}-100`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{deviceName}</CardTitle>
                      <p className="text-sm text-gray-500">Smart Device</p>
                    </div>
                  </div>
                  <Badge variant={data.isActive ? "default" : "secondary"}>{data.isActive ? "Active" : "Idle"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Current Power</p>
                    <p className="font-bold text-lg">{data.currentPower.toFixed(1)} W</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Energy</p>
                    <p className="font-bold text-lg">{data.totalEnergy.toFixed(2)} kWh</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Efficiency</span>
                    <span className="font-medium">{data.efficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={data.efficiency} className="h-2" />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Peak Usage</span>
                  <span className="font-medium text-orange-600">{data.peakUsage.toFixed(1)} W</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Device Details */}
      {selectedDevice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{selectedDevice} - Detailed Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDetails ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">Loading device details...</span>
              </div>
            ) : selectedDeviceDetails ? (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="usage" className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Usage Pattern</span>
                  </TabsTrigger>
                  <TabsTrigger value="forecast" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Forecast</span>
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="flex items-center space-x-2">
                    <BulbIcon className="h-4 w-4" />
                    <span>AI Suggestions</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {selectedDeviceDetails.current_power.toFixed(1)} W
                        </div>
                        <p className="text-sm text-gray-600">Current Power</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {selectedDeviceDetails.total_energy.toFixed(2)} kWh
                        </div>
                        <p className="text-sm text-gray-600">Total Energy</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-2">
                          {selectedDeviceDetails.peak_usage.toFixed(1)} W
                        </div>
                        <p className="text-sm text-gray-600">Peak Usage</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-2">
                          {selectedDeviceDetails.efficiency.toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-600">Efficiency</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Hourly Usage Pattern</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDeviceDetails.hourly_usage &&
                      Object.keys(selectedDeviceDetails.hourly_usage).length > 0 ? (
                        <ProfessionalChart
                          data={Object.entries(selectedDeviceDetails.hourly_usage).map(([hour, power]) => ({
                            hour: `${hour}:00`,
                            power,
                          }))}
                          type="line"
                          height={300}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          <p>No hourly usage data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CalendarDays className="h-5 w-5" />
                        <span>Daily Energy Consumption</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDeviceDetails.daily_usage &&
                      Object.keys(selectedDeviceDetails.daily_usage).length > 0 ? (
                        <ProfessionalChart
                          data={Object.entries(selectedDeviceDetails.daily_usage).map(([date, energy]) => ({
                            date: date,
                            energy: energy,
                          }))}
                          type="bar"
                          height={300}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          <p>No daily usage data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="forecast" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>30-Day Energy Forecast</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedDeviceDetails.predicted_kwh > 0 ? (
                        <>
                          <div className="text-center py-4">
                            <div className="text-3xl font-bold text-blue-600">
                              {selectedDeviceDetails.predicted_kwh.toFixed(2)} kWh
                            </div>
                            <p className="text-sm text-gray-600">Predicted consumption for next 30 days</p>
                          </div>
                          {selectedDeviceDetails.predicted_bill && (
                            <div className="text-center py-4 border-t">
                              <div className="text-2xl font-bold text-green-600">
                                ₹{selectedDeviceDetails.predicted_bill.total_amount}
                              </div>
                              <p className="text-sm text-gray-600">Estimated bill for predicted usage</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>Not enough data to generate a reliable forecast for this device.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {selectedDeviceDetails.suggestions?.map((suggestion: string, index: number) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <BulbIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Recommendation #{index + 1}</p>
                              <p className="text-sm text-gray-700">{suggestion}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )) || (
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <BulbIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500">No suggestions available for this device yet.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load device details. Please try again.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
