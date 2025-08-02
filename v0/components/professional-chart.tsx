"use client"

import { useEffect, useRef } from "react"

interface ProfessionalChartProps {
  data: any
  type: "line" | "bar" | "doughnut"
  height?: number
}

export default function ProfessionalChart({ data, type, height = 250 }: ProfessionalChartProps) {
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

      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "white",
            bodyColor: "white",
            borderColor: "rgba(59, 130, 246, 0.5)",
            borderWidth: 1,
            cornerRadius: 8,
          },
        },
      }

      if (type === "line" && Array.isArray(data)) {
        const labels = data.map((_, index) => `Point ${index + 1}`)
        const energyValues = data.map((item) => item.energy || Math.random() * 100)

        chartRef.current = new Chart.default(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Energy Consumption (kWh)",
                data: energyValues,
                borderColor: "#3B82F6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#3B82F6",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
            ],
          },
          options: {
            ...commonOptions,
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                  color: "#6B7280",
                },
                title: {
                  display: true,
                  text: "Energy (kWh)",
                  color: "#374151",
                },
              },
              x: {
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                  color: "#6B7280",
                },
                title: {
                  display: true,
                  text: "Time",
                  color: "#374151",
                },
              },
            },
          },
        })
      } else if (type === "doughnut" && data && typeof data === "object" && !Array.isArray(data)) {
        const labels = Object.keys(data).map((key) => key.charAt(0).toUpperCase() + key.slice(1)) // Dynamically get labels from data keys
        const chartData = Object.values(data) // Dynamically get data values
        const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#6366F1", "#EC4899", "#14B8A6"] // Added more colors for more devices

        chartRef.current = new Chart.default(ctx, {
          type: "doughnut",
          data: {
            labels: labels, // Use the dynamically generated labels
            datasets: [
              {
                data: chartData,
                backgroundColor: colors,
                borderWidth: 0,
                hoverBorderWidth: 2,
                hoverBorderColor: "#ffffff",
              },
            ],
          },
          options: {
            ...commonOptions,
            cutout: "60%",
            plugins: {
              ...commonOptions.plugins,
              tooltip: {
                ...commonOptions.plugins.tooltip,
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
      } else if (type === "bar" && Array.isArray(data)) {
        const labels = data.map((_, index) => `Day ${index + 1}`)
        const values = data.map(() => Math.random() * 100 + 20)

        chartRef.current = new Chart.default(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Daily Consumption",
                data: values,
                backgroundColor: "#3B82F6",
                borderColor: "#2563EB",
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            ...commonOptions,
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                  color: "#6B7280",
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: "#6B7280",
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
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
