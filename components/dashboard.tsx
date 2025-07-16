"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Activity, Battery, Cpu, Clock, AlertTriangle } from "lucide-react"
import ProfessionalChart from "@/components/professional-chart"
import DeviceOverview from "@/components/device-overview"

interface DashboardProps {
  connection: any
  energyData: any[]
  dashboardData: any
  deviceData: any
  isLoading: boolean
}

export default function Dashboard({ connection, energyData, dashboardData, deviceData, isLoading }: DashboardProps) {
  const deviceEntries = Object.entries(deviceData)
  const activeDevices = deviceEntries.filter(([_, device]: [string, any]) => device.isActive).length
  const totalDevices = deviceEntries.length
  const totalPower = deviceEntries.reduce((sum, [_, device]: [string, any]) => sum + device.currentPower, 0)
  const totalEnergy = deviceEntries.reduce((sum, [_, device]: [string, any]) => sum + device.totalEnergy, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Energy Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring of your smart home devices</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Cpu className="h-3 w-3 mr-1" />
            {activeDevices}/{totalDevices} Active
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Power</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalPower.toFixed(1)} W</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Energy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalEnergy.toFixed(2)} kWh</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Battery className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activeDevices}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Cpu className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peak Period</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">
                  {dashboardData?.peak?.peak_period || "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Overview */}
      <DeviceOverview deviceData={deviceData} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Usage by Time Period</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.peak?.period_kwh ? (
              <ProfessionalChart data={dashboardData.peak.period_kwh} type="doughnut" height={300} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No usage data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Power Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Device Power Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceEntries.length > 0 ? (
              <ProfessionalChart
                data={Object.fromEntries(deviceEntries.map(([name, data]: [string, any]) => [name, data.currentPower]))}
                type="doughnut"
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No device data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predictions and Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-Day Prediction */}
        <Card>
          <CardHeader>
            <CardTitle>30-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.prediction ? (
              <>
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-blue-600">{dashboardData.prediction.predicted_kwh} kWh</div>
                  <p className="text-sm text-gray-600">Predicted consumption</p>
                </div>
                <div className="text-center py-4 border-t">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{dashboardData.prediction.bill?.total_amount}
                  </div>
                  <p className="text-sm text-gray-600">Estimated bill</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Upload data to see predictions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.suggestions && dashboardData.suggestions.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Upload data to get AI suggestions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
