"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface FileUploadProps {
  onFileUpload: (file: File) => void
  uploadStatus: {
    type: "success" | "error" | "loading" | null
    message: string
  }
  isConnected: boolean
}

export default function FileUpload({ onFileUpload, uploadStatus, isConnected }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
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

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      return
    }
    onFileUpload(file)
  }

  const getStatusIcon = () => {
    switch (uploadStatus.type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : isConnected
              ? "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              : "border-gray-200 bg-gray-50"
        } ${!isConnected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => isConnected && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`p-3 rounded-full ${isDragOver ? "bg-blue-100" : "bg-gray-100"}`}>
            <FileText className={`h-8 w-8 ${isDragOver ? "text-blue-600" : "text-gray-600"}`} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? "Drop your file here" : "Upload Energy Data"}
            </h3>
            <p className="text-gray-600 mb-4">Drag and drop your JSON file here, or click to select</p>

            <Button disabled={!isConnected} variant="outline" className="gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              Choose File
            </Button>
          </div>

          <p className="text-xs text-gray-500">Supports JSON files only</p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

      {uploadStatus.type && (
        <Alert variant={uploadStatus.type === "error" ? "destructive" : "default"}>
          {getStatusIcon()}
          <AlertDescription className="ml-2">{uploadStatus.message}</AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Backend connection required to upload files. Please check your connection.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
