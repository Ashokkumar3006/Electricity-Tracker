"use client"

import { motion } from "framer-motion"

interface EnergyOrbProps {
  size?: number
}

export default function EnergyOrb({ size = 80 }: EnergyOrbProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute inset-2 rounded-full border border-purple-400/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />

      {/* Inner core */}
      <motion.div
        className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{
          boxShadow: `
            0 0 20px rgba(0, 255, 255, 0.5),
            0 0 40px rgba(0, 255, 255, 0.3),
            0 0 60px rgba(0, 255, 255, 0.1),
            inset 0 0 20px rgba(255, 255, 255, 0.2)
          `,
        }}
      />

      {/* Energy particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{
            left: "50%",
            top: "50%",
            transformOrigin: `0 ${size / 4}px`,
          }}
          animate={{
            rotate: [0, 360],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.375,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
