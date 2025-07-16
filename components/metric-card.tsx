"use client"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: LucideIcon
  color: "blue" | "green" | "orange" | "purple"
}

const colorClasses = {
  blue: "text-blue-600 bg-blue-100",
  green: "text-green-600 bg-green-100",
  orange: "text-orange-600 bg-orange-100",
  purple: "text-purple-600 bg-purple-100",
}

export default function MetricCard({ title, value, change, trend, icon: Icon, color }: MetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <div className="flex items-center mt-2">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {change}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
