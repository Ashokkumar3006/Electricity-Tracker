"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, Menu, User, Wifi, WifiOff } from "lucide-react"

interface ProfessionalHeaderProps {
  connection: any
  onRetryConnection: () => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export default function ProfessionalHeader({
  connection,
  onRetryConnection,
  sidebarCollapsed,
  onToggleSidebar,
}: ProfessionalHeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="p-2">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart Energy Monitor</h1>
              <p className="text-sm text-gray-500">Professional Energy Management</p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {connection.isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Badge variant={connection.isConnected ? "default" : "destructive"} className="text-xs">
              {connection.isConnected ? "Connected" : "Offline"}
            </Badge>
          </div>

          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
