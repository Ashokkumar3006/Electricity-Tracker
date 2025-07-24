"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  TrendingUp,
  Zap,
  Battery,
  Cpu,
  Clock,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Calendar,
} from "lucide-react"
import ProfessionalChart from "./professional-chart"
import DeviceOverview from "./device-overview"

interface ProfessionalDashboardProps {
  connection: any
  energyData: any[]
  dashboardData: any
  deviceData: any
  isLoading: boolean
}

export default function ProfessionalDashboard({
  connection,
  energyData,
  dashboardData,
  deviceData,
  isLoading,
}: ProfessionalDashboardProps) {
  const [selectedPredictionPeriod, setSelectedPredictionPeriod] = useState("30")
  const [forecastData, setForecastData] = useState<any>(null)
  const [isLoadingForecast, setIsLoadingForecast] = useState(false)

  const deviceEntries = Object.entries(deviceData)
  const activeDevices = deviceEntries.filter(([_, device]: [string, any]) => device.isActive).length
  const totalDevices = deviceEntries.length
  const totalPower = deviceEntries.reduce((sum, [_, device]: [string, any]) => sum + device.currentPower, 0)
  const totalEnergy = deviceEntries.reduce((sum, [_, device]: [string, any]) => sum + device.totalEnergy, 0)

  const predictionOptions = [
    { value: "15", label: "15 Days", description: "2 weeks forecast" },
    { value: "30", label: "30 Days", description: "1 month forecast" },
    { value: "45", label: "45 Days", description: "6 weeks forecast" },
    { value: "60", label: "60 Days", description: "2 months forecast" },
    { value: "90", label: "90 Days", description: "3 months forecast" },
    { value: "365", label: "365 Days", description: "1 year forecast" },
  ]

  const handlePredictionPeriodChange = async (period: string) => {
    setSelectedPredictionPeriod(period)
    setIsLoadingForecast(true)

    try {
      // Simulate API call for different prediction periods
      // In real implementation, this would call your backend with the period parameter
      const response = await fetch(`http://localhost:5000/api/predict?days=${period}`)

      if (response.ok) {
        const data = await response.json()
        setForecastData(data)
      } else {
        // Fallback to current data with adjusted calculations
        const baseData = dashboardData?.prediction
        if (baseData) {
          const multiplier = Number.parseInt(period) / 30
          setForecastData({
            predicted_kwh: (baseData.predicted_kwh * multiplier).toFixed(2),
            bill: {
              total_amount: (baseData.bill?.total_amount * multiplier).toFixed(2),
            },
          })
        }
      }
    } catch (error) {
      console.error("Error fetching forecast:", error)
      // Use default data with period adjustment
      const baseData = dashboardData?.prediction
      if (baseData) {
        const multiplier = Number.parseInt(period) / 30
        setForecastData({
          predicted_kwh: (baseData.predicted_kwh * multiplier).toFixed(2),
          bill: {
            total_amount: (baseData.bill?.total_amount * multiplier).toFixed(2),
          },
        })
      }
    } finally {
      setIsLoadingForecast(false)
    }
  }

  // Use forecast data if available, otherwise use dashboard data
  const currentForecast = forecastData || dashboardData?.prediction
  const selectedOption = predictionOptions.find((option) => option.value === selectedPredictionPeriod)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Energy Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring and intelligent insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Power</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalPower.toFixed(1)} W</p>
                  <p className="text-xs text-green-600 mt-1">Real-time consumption</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Energy</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalEnergy.toFixed(2)} kWh</p>
                  <p className="text-xs text-blue-600 mt-1">Cumulative usage</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Battery className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Devices</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {activeDevices}/{totalDevices}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Online systems</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Cpu className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Peak Period</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">
                    {dashboardData?.peak?.peak_period || "N/A"}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">High usage time</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Device Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <DeviceOverview deviceData={deviceData} />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Usage by Time Period</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.peak?.period_kwh ? (
                <ProfessionalChart data={dashboardData.peak.period_kwh} type="doughnut" height={300} />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No usage data available</p>
                    <p className="text-sm">Upload energy data to view patterns</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span>Device Power Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceEntries.length > 0 ? (
                <ProfessionalChart
                  data={Object.fromEntries(
                    deviceEntries.map(([name, data]: [string, any]) => [name, data.currentPower]),
                  )}
                  type="doughnut"
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No device data available</p>
                    <p className="text-sm">Upload data to view distribution</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Predictions and Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Energy Forecast</span>
                </CardTitle>

                <Select value={selectedPredictionPeriod} onValueChange={handlePredictionPeriodChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {predictionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-gray-500">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentForecast ? (
                <>
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-600">{selectedOption?.label} Prediction</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {isLoadingForecast ? "Loading..." : `${currentForecast.predicted_kwh} kWh`}
                    </div>
                    <p className="text-sm text-gray-600">Predicted consumption</p>
                  </div>
                  <div className="text-center py-4 border-t border-gray-100">
                    <div className="text-2xl font-bold text-blue-600 mb-2 flex items-center justify-center">
                      <IndianRupee className="h-6 w-6 mr-1" />
                      {isLoadingForecast ? "..." : currentForecast.bill?.total_amount}
                    </div>
                    <p className="text-sm text-gray-600">Estimated bill</p>
                  </div>

                  {/* Period comparison */}
                  <div className="bg-gray-50 rounded-lg p-3 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Daily Average:</span>
                      <span className="font-medium">
                        {isLoadingForecast
                          ? "..."
                          : `${(currentForecast.predicted_kwh / Number.parseInt(selectedPredictionPeriod)).toFixed(2)} kWh`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Daily Cost:</span>
                      <span className="font-medium">
                        ₹
                        {isLoadingForecast
                          ? "..."
                          : `${(currentForecast.bill?.total_amount / Number.parseInt(selectedPredictionPeriod)).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">Upload data to see predictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span>AI Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.suggestions && dashboardData.suggestions.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">Upload data to get AI suggestions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
