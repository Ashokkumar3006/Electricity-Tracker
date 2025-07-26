"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import ProfessionalHeader from "@/components/professional-header"
import ProfessionalSidebar from "@/components/professional-sidebar"
import ProfessionalDashboard from "@/components/professional-dashboard"
import DeviceMonitoring from "@/components/device-monitoring"
import Analytics from "@/components/analytics"
import DataUpload from "@/components/data-upload"
import BillCalculator from "@/components/bill-calculator"
import AIAssistant from "@/components/ai-assistant"
import AlertManagement from "@/components/alert-management"
import { Toaster } from "@/components/ui/toaster"

interface EnergyData {
  timestamp: string
  device: string
  power: number
  voltage: number
  current: number
  energy_kwh: number
}

interface ConnectionState {
  isConnected: boolean
  status: string
  lastChecked: Date | null
}

interface DeviceData {
  [deviceName: string]: {
    totalEnergy: number
    currentPower: number
    peakUsage: number
    efficiency: number
    suggestions: string[]
    isActive: boolean
  }
}

const API_BASE = "http://localhost:5000/api"

export default function SmartEnergyDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [connection, setConnection] = useState<ConnectionState>({
    isConnected: false,
    status: "Connecting...",
    lastChecked: null,
  })
  const [energyData, setEnergyData] = useState<EnergyData[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [deviceData, setDeviceData] = useState<DeviceData>({})
  const [isLoading, setIsLoading] = useState(true)

  const checkBackendConnection = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${API_BASE}/health`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setConnection({
          isConnected: true,
          status: `Connected • ${data.data_loaded ? "Data Loaded" : "No Data"}`,
          lastChecked: new Date(),
        })
      } else {
        throw new Error("Service unavailable")
      }
    } catch (error) {
      setConnection({
        isConnected: false,
        status: `Offline • ${error instanceof Error ? error.message : "Connection failed"}`,
        lastChecked: new Date(),
      })
    }
  }, [])

  const loadDashboardData = useCallback(async () => {
    if (!connection.isConnected) return

    setIsLoading(true)
    try {
      const [peakResponse, predictionResponse, suggestionsResponse, devicesResponse] = await Promise.all([
        fetch(`${API_BASE}/peak`),
        fetch(`${API_BASE}/predict`),
        fetch(`${API_BASE}/suggestions`),
        fetch(`${API_BASE}/devices`),
      ])

      const results = await Promise.all([
        peakResponse.ok ? peakResponse.json() : null,
        predictionResponse.ok ? predictionResponse.json() : null,
        suggestionsResponse.ok ? suggestionsResponse.json() : null,
        devicesResponse.ok ? devicesResponse.json() : null,
      ])

      setDashboardData({
        peak: results[0],
        prediction: results[1],
        suggestions: results[2]?.suggestions || [],
      })

      if (results[3]) {
        setDeviceData(results[3])
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [connection.isConnected])

  useEffect(() => {
    checkBackendConnection()
    const interval = setInterval(checkBackendConnection, 30000)
    return () => clearInterval(interval)
  }, [checkBackendConnection])

  useEffect(() => {
    if (connection.isConnected) {
      loadDashboardData()
    }
  }, [connection.isConnected, loadDashboardData])

  const handleDataUpload = (data: EnergyData[]) => {
    setEnergyData(data)
    loadDashboardData()
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <ProfessionalDashboard
            connection={connection}
            energyData={energyData}
            dashboardData={dashboardData}
            deviceData={deviceData}
            isLoading={isLoading}
          />
        )
      case "devices":
        return <DeviceMonitoring deviceData={deviceData} connection={connection} onTabChange={setActiveTab} />
      case "analytics":
        return <Analytics energyData={energyData} dashboardData={dashboardData} deviceData={deviceData} />
      case "upload":
        return <DataUpload connection={connection} onDataUpload={handleDataUpload} onDataLoaded={loadDashboardData} />
      case "calculator":
        return <BillCalculator connection={connection} />
      case "alerts":
        return <AlertManagement connection={connection} />
      default:
        return (
          <ProfessionalDashboard
            connection={connection}
            energyData={energyData}
            dashboardData={dashboardData}
            deviceData={deviceData}
            isLoading={isLoading}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalHeader
        connection={connection}
        onRetryConnection={checkBackendConnection}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex">
        <ProfessionalSidebar activeTab={activeTab} onTabChange={setActiveTab} collapsed={sidebarCollapsed} />

        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
          <div className="p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>

      <AIAssistant />
      <Toaster />
    </div>
  )
}
