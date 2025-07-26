"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface ConnectionState {
  isConnected: boolean
  status: string
  lastChecked: Date | null
}

interface ConnectionStatusProps {
  connection: ConnectionState
  onRetry: () => void
}

export default function ConnectionStatus({ connection, onRetry }: ConnectionStatusProps) {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
      <div className="flex items-center gap-2">
        {connection.isConnected ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
        <Badge variant={connection.isConnected ? "default" : "destructive"} className="font-medium">
          {connection.isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <span className="text-sm text-gray-600">{connection.status}</span>

      {!connection.isConnected && (
        <Button size="sm" variant="outline" onClick={onRetry} className="ml-2 bg-transparent">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}
