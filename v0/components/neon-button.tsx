"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface NeonButtonProps {
  children: string
  active?: boolean
  onClick?: () => void
  icon?: LucideIcon
  onHover?: () => void
}

export default function NeonButton({ children, active, onClick, icon: Icon, onHover }: NeonButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={onHover}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
        active
          ? "text-black bg-gradient-to-r from-cyan-400 to-purple-500 shadow-lg shadow-cyan-400/25"
          : "text-cyan-400 hover:text-white hover:bg-white/10"
      }`}
    >
      {/* Neon glow effect */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 blur-sm opacity-75"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      <div className="relative flex items-center space-x-2">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{children}</span>
      </div>

      {/* Border animation */}
      {!active && (
        <div className="absolute inset-0 rounded-xl border border-cyan-400/30 hover:border-cyan-400/60 transition-colors duration-300" />
      )}
    </motion.button>
  )
}
