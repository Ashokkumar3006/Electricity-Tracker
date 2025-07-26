"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface HolographicChartProps {
  data: any[]
  type: "energy" | "distribution" | "temporal" | "frequency" | "efficiency" | "load" | "harmonic"
}

export default function HolographicChart({ data, type }: HolographicChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    function drawChart() {
      if (!ctx) return

      ctx.clearRect(0, 0, width, height)

      // Create holographic effect
      ctx.shadowBlur = 10
      ctx.shadowColor = "#00ffff"

      switch (type) {
        case "energy":
          drawEnergyWave(ctx, width, height)
          break
        case "distribution":
          drawDistributionChart(ctx, width, height)
          break
        case "temporal":
          drawTemporalChart(ctx, width, height)
          break
        case "frequency":
          drawFrequencyChart(ctx, width, height)
          break
        case "efficiency":
          drawEfficiencyChart(ctx, width, height)
          break
        case "load":
          drawLoadChart(ctx, width, height)
          break
        case "harmonic":
          drawHarmonicChart(ctx, width, height)
          break
      }
    }

    function drawEnergyWave(ctx: CanvasRenderingContext2D, width: number, height: number) {
      const time = Date.now() * 0.001

      ctx.strokeStyle = "#00ffff"
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let x = 0; x < width; x += 2) {
        const y =
          height / 2 +
          Math.sin(x * 0.02 + time) * 30 +
          Math.sin(x * 0.01 + time * 1.5) * 20 +
          Math.sin(x * 0.005 + time * 0.5) * 10

        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Add secondary wave
      ctx.strokeStyle = "#ff00ff"
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x < width; x += 2) {
        const y = height / 2 + Math.sin(x * 0.015 + time * 2) * 20
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    function drawDistributionChart(ctx: CanvasRenderingContext2D, width: number, height: number) {
      const segments = 4
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 3

      const colors = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00"]
      const values = [30, 25, 25, 20] // Sample data

      let currentAngle = 0
      values.forEach((value, index) => {
        const angle = (value / 100) * Math.PI * 2

        ctx.fillStyle = colors[index]
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle)
        ctx.closePath()
        ctx.fill()

        currentAngle += angle
      })
    }

    function drawTemporalChart(ctx: CanvasRenderingContext2D, width: number, height: number) {
      const time = Date.now() * 0.001
      const bars = 20
      const barWidth = width / bars

      for (let i = 0; i < bars; i++) {
        const barHeight = (Math.sin(time + i * 0.5) + 1) * height * 0.4

        ctx.fillStyle = `hsl(${180 + i * 10}, 100%, 50%)`
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight)
      }
    }

    function drawFrequencyChart(ctx: CanvasRenderingContext2D, width: number, height: number) {
      const time = Date.now() * 0.001

      ctx.strokeStyle = "#ffff00"
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let x = 0; x < width; x += 1) {
        const frequency = 0.1 + (x / width) * 0.5
        const y = height / 2 + Math.sin(time * frequency * 10) * (height * 0.3) * (1 - x / width)

        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    function drawEfficiencyChart(ctx: CanvasRenderingContext2D, width: number, height: number) {
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 3
      const efficiency = 0.85 // 85%

      // Background circle
      ctx.strokeStyle = "#333"
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()

      // Efficiency arc
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + efficiency * Math.PI * 2)
      ctx.stroke()

      // Center text
      ctx.fillStyle = "#00ff00"
      ctx.font = "24px monospace"
      ctx.textAlign = "center"
      ctx.fillText(`${Math.round(efficiency * 100)}%`, centerX, centerY)
    }

    function drawLoadChart(ctx: CanvasRenderingContext2D, width: number, height: number) {
      const time = Date.now() * 0.001
      const points = 50

      ctx.strokeStyle = "#ff00ff"
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let i = 0; i < points; i++) {
        const x = (i / points) * width
        const y = height / 2 + Math.sin(time + i * 0.2) * height * 0.3

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    function drawHarmonicChart(ctx: CanvasRenderingContext2D, width: number, height: number) {
      const harmonics = 5
      const time = Date.now() * 0.001

      for (let h = 1; h <= harmonics; h++) {
        ctx.strokeStyle = `hsl(${h * 60}, 100%, 50%)`
        ctx.lineWidth = 3 - h * 0.4
        ctx.beginPath()

        for (let x = 0; x < width; x += 2) {
          const y = height / 2 + Math.sin(x * 0.02 * h + time * h) * ((height * 0.2) / h)

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }

    const animate = () => {
      drawChart()
      requestAnimationFrame(animate)
    }

    animate()
  }, [data, type])

  return (
    <motion.div
      className="w-full h-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 0 10px rgba(0, 255, 255, 0.5))" }}
      />
    </motion.div>
  )
}
