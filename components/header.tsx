"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, Zap, Wifi, WifiOff, RefreshCw, Bell, User, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ConnectionState {
  isConnected: boolean
  status: string
  lastChecked: Date | null
}

interface HeaderProps {
  connection: ConnectionState
  onRetryConnection: () => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export default function Header({ connection, onRetryConnection, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
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
              <p className="text-sm text-gray-500">Professional Energy Management System</p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <motion.div className="flex items-center space-x-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center space-x-2">
              {connection.isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <Badge variant={connection.isConnected ? "default" : "destructive"} className="font-medium">
                {connection.isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>

            {!connection.isConnected && (
              <Button size="sm" variant="outline" onClick={onRetryConnection} className="ml-2 bg-transparent">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </motion.div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium">Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-6 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{connection.status}</span>
          <span>Last updated: {connection.lastChecked?.toLocaleTimeString() || "Never"}</span>
        </div>
      </div>
    </header>
  )
}
