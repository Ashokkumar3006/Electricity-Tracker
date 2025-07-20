"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Upload, Calculator, Cpu } from "lucide-react" // Removed FileText

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed: boolean
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "devices", label: "Device Monitoring", icon: Cpu },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "upload", label: "Data Upload", icon: Upload },
  { id: "calculator", label: "Bill Calculator", icon: Calculator },
  // Removed 'reports' and 'help' from here as they were in secondaryItems
]

// Removed secondaryItems array entirely

export default function Sidebar({ activeTab, onTabChange, collapsed }: SidebarProps) {
  return (
    <motion.aside
      className={`fixed left-0 top-[73px] h-[calc(100vh-73px)] bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 p-4 space-y-2">
          <div className={`mb-6 ${collapsed ? "hidden" : "block"}`}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Menu</h2>
          </div>

          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${collapsed ? "px-2" : "px-3"}`}
              onClick={() => onTabChange(item.id)}
            >
              <item.icon className={`h-5 w-5 ${collapsed ? "" : "mr-3"}`} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}

          {/* Removed the "Additional" section entirely */}
          {/* Removed secondaryItems mapping */}
        </nav>

        {/* Removed the entire copyright footer section */}
      </div>
    </motion.aside>
  )
}
