"use client"

import { motion } from "framer-motion"
import { Zap, Battery, TrendingUp } from "lucide-react"

interface FloatingMetricsProps {
  currentPower: number
  totalEnergy: number
  efficiency: number
}

export default function FloatingMetrics({ currentPower, totalEnergy, efficiency }: FloatingMetricsProps) {
  const metrics = [
    {
      icon: Zap,
      label: "CURRENT POWER",
      value: `${currentPower.toFixed(1)}W`,
      color: "cyan",
      position: { x: 0, y: 0 },
    },
    {
      icon: Battery,
      label: "TOTAL ENERGY",
      value: `${totalEnergy.toFixed(2)}kWh`,
      color: "purple",
      position: { x: 300, y: 50 },
    },
    {
      icon: TrendingUp,
      label: "EFFICIENCY",
      value: `${efficiency.toFixed(1)}%`,
      color: "green",
      position: { x: 600, y: 0 },
    },
  ]

  return (
    <div className="relative h-32 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.2,
            y: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          }}
          className={`absolute backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 
            border border-white/20 rounded-2xl p-4 shadow-2xl`}
          style={{
            left: `${metric.position.x}px`,
            top: `${metric.position.y}px`,
            transform: `translateX(${index * 25}%)`,
          }}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${metric.color}-500/20`}>
              <metric.icon className={`w-6 h-6 text-${metric.color}-400`} />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">{metric.label}</div>
              <div className={`text-xl font-bold text-${metric.color}-400`}>{metric.value}</div>
            </div>
          </div>

          {/* Pulse effect */}
          <motion.div
            className={`absolute inset-0 rounded-2xl border-2 border-${metric.color}-400/50`}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.5,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}
