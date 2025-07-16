"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, CheckCircle, AlertCircle, Download, Info } from "lucide-react"

interface DataUploadProps {
  connection: any
  onDataUpload: (data: any[]) => void
  onDataLoaded: () => void
}

export default function DataUpload({ connection, onDataUpload, onDataLoaded }: DataUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "loading" | null
    message: string
    progress?: number
  }>({ type: null, message: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      setUploadStatus({
        type: "error",
        message: "Invalid file format. Please select a JSON file.",
      })
      return
    }

    if (!connection.isConnected) {
      setUploadStatus({
        type: "error",
        message: "Backend connection required. Please check your connection.",
      })
      return
    }

    setUploadStatus({ type: "loading", message: "Reading file...", progress: 10 })

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        throw new Error("Data must be an array of energy readings")
      }

      setUploadStatus({ type: "loading", message: "Validating data...", progress: 30 })

      // Simulate validation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUploadStatus({ type: "loading", message: "Uploading to server...", progress: 60 })

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      setUploadStatus({ type: "loading", message: "Processing data...", progress: 90 })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (response.ok && result.status === "success") {
        setUploadStatus({
          type: "success",
          message: `Successfully uploaded ${result.rows_loaded || data.length} energy readings`,
          progress: 100,
        })
        onDataUpload(data)
        onDataLoaded()
      } else {
        setUploadStatus({
          type: "error",
          message: result.error || "Upload failed",
        })
      }
    } catch (error) {
      setUploadStatus({
        type: "error",
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  }

  const downloadSample = () => {
    const sampleData = [
      {
        timestamp: "2024-01-01T00:00:00Z",
        power: 750.5,
        voltage: 240.2,
        current: 3.12,
        energy: 0.75,
      },
      {
        timestamp: "2024-01-01T01:00:00Z",
        power: 680.3,
        voltage: 239.8,
        current: 2.84,
        energy: 0.68,
      },
    ]

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample-energy-data.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Upload</h1>
        <p className="text-gray-600">Upload your energy consumption data for analysis and monitoring</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Energy Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : connection.isConnected
                  ? "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => connection.isConnected && fileInputRef.current?.click()}
            whileHover={connection.isConnected ? { scale: 1.01 } : {}}
            whileTap={connection.isConnected ? { scale: 0.99 } : {}}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isDragOver ? "Drop your file here" : "Upload Energy Data File"}
                </h3>
                <p className="text-gray-600 mb-4">Drag and drop your JSON file here, or click to browse</p>

                <Button disabled={!connection.isConnected} variant="outline" className="mb-4 bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>

                <p className="text-xs text-gray-500">Supports JSON files up to 10MB</p>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          </motion.div>

          {/* Upload Progress */}
          {uploadStatus.type === "loading" && uploadStatus.progress && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{uploadStatus.message}</span>
                <span className="font-medium">{uploadStatus.progress}%</span>
              </div>
              <Progress value={uploadStatus.progress} className="h-2" />
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus.type && uploadStatus.type !== "loading" && (
            <Alert
              className={`mt-6 ${
                uploadStatus.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              }`}
            >
              {uploadStatus.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={uploadStatus.type === "success" ? "text-green-800" : "text-red-800"}>
                {uploadStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {!connection.isConnected && (
            <Alert className="mt-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Backend connection required to upload files. Please check your connection.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Format Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Data Format Requirements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Required Fields</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <code className="bg-gray-100 px-1 rounded">timestamp</code> - ISO 8601 format
                </li>
                <li>
                  • <code className="bg-gray-100 px-1 rounded">power</code> - Power in Watts
                </li>
                <li>
                  • <code className="bg-gray-100 px-1 rounded">voltage</code> - Voltage in Volts
                </li>
                <li>
                  • <code className="bg-gray-100 px-1 rounded">current</code> - Current in Amperes
                </li>
                <li>
                  • <code className="bg-gray-100 px-1 rounded">energy</code> - Energy in kWh
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">File Specifications</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Format: JSON array</li>
                <li>• Maximum size: 10MB</li>
                <li>• Encoding: UTF-8</li>
                <li>• Extension: .json</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono mb-4">
              <pre>{`[
  {
    "timestamp": "2024-01-01T00:00:00Z",
    "power": 750.5,
    "voltage": 240.2,
    "current": 3.12,
    "energy": 0.75
  },
  {
    "timestamp": "2024-01-01T01:00:00Z",
    "power": 680.3,
    "voltage": 239.8,
    "current": 2.84,
    "energy": 0.68
  }
]`}</pre>
            </div>

            <Button onClick={downloadSample} variant="outline" className="w-full bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Download Sample File
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
