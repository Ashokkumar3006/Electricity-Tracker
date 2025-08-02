"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Battery,
  Cpu,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

interface ProfessionalMetricsProps {
  totalPower: number
  totalEnergy: number
  activeDevices: number
  totalDevices: number
  peakPeriod: string
  efficiency: number
  monthlyCost: number
  savings: number
}

export default function ProfessionalMetrics({
  totalPower,
  totalEnergy,
  activeDevices,
  totalDevices,
  peakPeriod,
  efficiency,
  monthlyCost,
  savings,
}: ProfessionalMetricsProps) {
  const metrics = [
    {
      title: "Real-time Power",
      value: `${totalPower.toFixed(1)} W`,
      change: "+12.5%",
      trend: "up" as const,
      icon: Zap,
      color: "blue",
      description: "Current consumption",
    },
    {
      title: "Total Energy",
      value: `${totalEnergy.toFixed(2)} kWh`,
      change: "+8.2%",
      trend: "up" as const,
      icon: Battery,
      color: "green",
      description: "Cumulative usage",
    },
    {
      title: "Active Devices",
      value: `${activeDevices}/${totalDevices}`,
      change: "Normal",
      trend: "up" as const,
      icon: Cpu,
      color: "purple",
      description: "Online systems",
    },
    {
      title: "System Efficiency",
      value: `${efficiency.toFixed(1)}%`,
      change: efficiency > 85 ? "+2.1%" : "-1.3%",
      trend: efficiency > 85 ? ("up" as const) : ("down" as const),
      icon: Activity,
      color: efficiency > 85 ? "green" : "orange",
      description: "Performance index",
    },
    {
      title: "Peak Period",
      value: peakPeriod.charAt(0).toUpperCase() + peakPeriod.slice(1),
      change: "Detected",
      trend: "up" as const,
      icon: Clock,
      color: "cyan",
      description: "High usage time",
    },
    {
      title: "Monthly Cost",
      value: `₹${monthlyCost.toFixed(0)}`,
      change: savings > 0 ? `-₹${savings.toFixed(0)}` : "Baseline",
      trend: savings > 0 ? ("down" as const) : ("up" as const),
      icon: DollarSign,
      color: savings > 0 ? "green" : "red",
      description: "Estimated bill",
    },
  ]

  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-100",
    green: "from-green-500 to-green-600 text-green-100",
    purple: "from-purple-500 to-purple-600 text-purple-100",
    orange: "from-orange-500 to-orange-600 text-orange-100",
    cyan: "from-cyan-500 to-cyan-600 text-cyan-100",
    red: "from-red-500 to-red-600 text-red-100",
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/20" />

            {/* Animated Background Orb */}
            <motion.div
              className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${colorClasses[metric.color as keyof typeof colorClasses]} rounded-full opacity-10`}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />

            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[metric.color as keyof typeof colorClasses]} shadow-lg`}
                  >
                    <metric.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{metric.title}</h3>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`${
                    metric.trend === "up"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.change}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{metric.value}</div>

                {/* Status Indicator */}
                <div className="flex items-center space-x-2">
                  {metric.title === "System Efficiency" && efficiency > 85 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : metric.title === "System Efficiency" && efficiency < 70 ? (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-xs text-gray-600">
                    {metric.title === "System Efficiency" && efficiency > 85
                      ? "Optimal Performance"
                      : metric.title === "System Efficiency" && efficiency < 70
                        ? "Needs Attention"
                        : "Real-time Data"}
                  </span>
                </div>
              </div>

              {/* Progress Bar for Efficiency */}
              {metric.title === "System Efficiency" && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${
                        efficiency > 85
                          ? "from-green-400 to-green-600"
                          : efficiency > 70
                            ? "from-yellow-400 to-yellow-600"
                            : "from-red-400 to-red-600"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${efficiency}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
