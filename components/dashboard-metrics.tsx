"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, IndianRupee } from "lucide-react"

interface PeakData {
  peak_period: string
  period_kwh: {
    morning: number
    afternoon: number
    evening: number
    night: number
  }
}

interface PredictionData {
  predicted_kwh: number
  bill: {
    total_amount: number
  }
}

interface DashboardMetricsProps {
  peakData: PeakData | null
  predictionData: PredictionData | null
  isLoading: boolean
}

export default function DashboardMetrics({ peakData, predictionData, isLoading }: DashboardMetricsProps) {
  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1)
  }

  const getPeriodColor = (period: string) => {
    const colors = {
      morning: "bg-yellow-100 text-yellow-800",
      afternoon: "bg-orange-100 text-orange-800",
      evening: "bg-purple-100 text-purple-800",
      night: "bg-blue-100 text-blue-800",
    }
    return colors[period as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Peak Usage Period */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Peak Usage Period</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ) : peakData ? (
              <>
                <Badge className={`text-lg px-3 py-1 ${getPeriodColor(peakData.peak_period)}`} variant="secondary">
                  {formatPeriod(peakData.peak_period)}
                </Badge>
                <p className="text-xs text-muted-foreground">Primary consumption time</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Prediction */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">30-Day Prediction</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </div>
            ) : predictionData ? (
              <>
                <div className="text-2xl font-bold text-green-600">{predictionData.predicted_kwh} kWh</div>
                <p className="text-xs text-muted-foreground">Predicted consumption</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estimated Bill */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estimated Bill</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ) : predictionData?.bill ? (
              <>
                <div className="text-2xl font-bold text-blue-600">₹{predictionData.bill.total_amount}</div>
                <p className="text-xs text-muted-foreground">For 30 days</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
