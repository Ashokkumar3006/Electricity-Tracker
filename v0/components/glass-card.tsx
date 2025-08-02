"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  title?: string
  className?: string
}

export default function GlassCard({ children, title, className = "" }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`relative backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 
        border border-white/20 rounded-2xl p-6 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Holographic border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />

      {/* Inner glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 to-purple-600/5" />

      {title && (
        <div className="relative z-10 mb-4">
          <h3 className="text-sm font-bold text-cyan-400 tracking-wider uppercase">{title}</h3>
          <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent mt-1" />
        </div>
      )}

      <div className="relative z-10">{children}</div>

      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-2xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-purple-400/50 rounded-br-2xl" />
    </motion.div>
  )
}
