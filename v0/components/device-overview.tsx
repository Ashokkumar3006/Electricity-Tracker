"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AirVent, Refrigerator, Tv, Lightbulb, Fan, Zap, AlertCircle } from "lucide-react"

interface DeviceOverviewProps {
  deviceData: any
}

const deviceIcons = {
  AC: AirVent,
  Fridge: Refrigerator,
  Television: Tv,
  "Washing Machine": Zap,
  Light: Lightbulb,
  Fan: Fan,
}

const deviceColors = {
  AC: "text-blue-600 bg-blue-100",
  Fridge: "text-green-600 bg-green-100",
  Television: "text-purple-600 bg-purple-100",
  "Washing Machine": "text-orange-600 bg-orange-100",
  Light: "text-yellow-600 bg-yellow-100",
  Fan: "text-cyan-600 bg-cyan-100",
}

export default function DeviceOverview({ deviceData }: DeviceOverviewProps) {
  const devices = Object.entries(deviceData)

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2 text-gray-500">No device data available</p>
          <p className="text-sm text-gray-400">Upload energy data to see device-specific insights</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Device Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(([deviceName, data]: [string, any]) => {
            const IconComponent = deviceIcons[deviceName as keyof typeof deviceIcons] || Zap
            const colorClass = deviceColors[deviceName as keyof typeof deviceColors] || "text-gray-600 bg-gray-100"

            return (
              <div key={deviceName} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{deviceName}</h3>
                      <p className="text-xs text-gray-500">Smart Device</p>
                    </div>
                  </div>
                  <Badge variant={data.isActive ? "default" : "secondary"}>{data.isActive ? "Active" : "Idle"}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Power</span>
                    <span className="font-medium">{data.currentPower.toFixed(1)} W</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Energy</span>
                    <span className="font-medium">{data.totalEnergy.toFixed(2)} kWh</span>
                  </div>

                  <div className="space-y-1">
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
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
