"use client"
import { Button } from "@/components/ui/button"
import { Zap, Menu } from "lucide-react" // Removed Wifi, WifiOff, RefreshCw, Bell, User, Settings, DropdownMenu imports

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

        {/* Right Section - Removed Connection Status and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications button (kept as an example, can be removed if not needed) */}
          <Button variant="ghost" size="sm" className="relative">
            {/* <Bell className="h-5 w-5" /> */}
            {/* <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span> */}
          </Button>
        </div>
      </div>

      {/* Removed Status Bar */}
    </header>
  )
}
