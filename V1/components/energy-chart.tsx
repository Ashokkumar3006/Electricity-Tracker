"use client"

import { useEffect, useRef } from "react"

interface EnergyChartProps {
  data: any
  type: "doughnut" | "line"
}

export default function EnergyChart({ data, type }: EnergyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return

    // Dynamically import Chart.js to avoid SSR issues
    import("chart.js/auto").then((Chart) => {
      const ctx = canvasRef.current?.getContext("2d")
      if (!ctx) return

      // Destroy existing chart
      if (chartRef.current) {
        chartRef.current.destroy()
      }

      if (type === "doughnut" && data) {
        const periods = ["morning", "afternoon", "evening", "night"]
        const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
        const chartData = periods.map((period) => data[period] || 0)

        chartRef.current = new Chart.default(ctx, {
          type: "doughnut",
          data: {
            labels: periods.map((p) => p.charAt(0).toUpperCase() + p.slice(1)),
            datasets: [
              {
                data: chartData,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: "#fff",
                hoverBorderWidth: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  padding: 20,
                  font: {
                    size: 12,
                  },
                },
              },
              tooltip: {
                callbacks: {
                  label: (context: any) => {
                    const value = context.parsed
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                    return `${context.label}: ${value} kWh (${percentage}%)`
                  },
                },
              },
            },
          },
        })
      } else if (type === "line" && Array.isArray(data)) {
        const labels = data.map((_, index) => `Point ${index + 1}`)
        const energyValues = data.map((item) => item.energy || 0)

        chartRef.current = new Chart.default(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Energy Consumption (kWh)",
                data: energyValues,
                borderColor: "#667eea",
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Energy (kWh)",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Time Points",
                },
              },
            },
          },
        })
      }
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, type])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available for chart</p>
      </div>
    )
  }

  return (
    <div className="relative h-64">
      <canvas ref={canvasRef} />
    </div>
  )
}
