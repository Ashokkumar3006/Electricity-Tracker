"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Zap, BarChart3, Upload, Calculator, Bell } from "lucide-react"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed?: boolean
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "devices", label: "Devices", icon: Zap },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "upload", label: "Data Upload", icon: Upload },
  { id: "calculator", label: "Bill Calculator", icon: Calculator },
  { id: "alerts", label: "Alert Management", icon: Bell },
]

export default function ProfessionalSidebar({ activeTab, onTabChange, collapsed = false }: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-5 w-5 mr-3")} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={cn("flex items-center text-xs text-gray-500", collapsed ? "justify-center" : "space-x-2")}>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            {!collapsed && <span>System Online</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
