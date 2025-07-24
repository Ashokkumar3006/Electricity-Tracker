"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Upload, Calculator, Cpu, Mail, Settings, HelpCircle } from "lucide-react"

interface ProfessionalSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed: boolean
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    id: "devices",
    label: "Device Monitoring",
    icon: Cpu,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: TrendingUp,
  },
  {
    id: "upload",
    label: "Data Upload",
    icon: Upload,
  },
  {
    id: "calculator",
    label: "Bill Calculator",
    icon: Calculator,
  },
  {
    id: "email-alerts",
    label: "Email Alerts",
    icon: Mail,
  },
]

export default function ProfessionalSidebar({ activeTab, onTabChange, collapsed }: ProfessionalSidebarProps) {
  return (
    <motion.aside
      className={`fixed left-0 top-[73px] h-[calc(100vh-73px)] bg-white border-r border-gray-200 shadow-sm 
        transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
    >
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {!collapsed && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h2>
            </div>
          )}

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
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex ${collapsed ? "flex-col space-y-2" : "space-x-2"}`}>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Settings className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Settings</span>}
            </Button>
            {!collapsed && (
              <Button variant="ghost" size="sm" className="text-gray-600">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
