"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import GlassCard from "./glass-card"

interface FuturisticUploadProps {
  onDataUpload: (data: any[]) => void
}

export default function FuturisticUpload({ onDataUpload }: FuturisticUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "loading" | null
    message: string
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

    setUploadStatus({ type: "loading", message: "Processing quantum data matrix..." })

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        throw new Error("Data must be an array of energy readings")
      }

      // Simulate upload to backend
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setUploadStatus({
        type: "success",
        message: `Successfully uploaded ${data.length} energy readings to quantum matrix`,
      })

      onDataUpload(data)
    } catch (error) {
      setUploadStatus({
        type: "error",
        message: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  }

  return (
    <div className="space-y-8">
      <GlassCard title="QUANTUM DATA MATRIX UPLOAD" className="min-h-96">
        <motion.div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            isDragOver
              ? "border-cyan-400 bg-cyan-400/10"
              : "border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-400/5"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Animated upload icon */}
          <motion.div
            className="mb-6"
            animate={{
              y: isDragOver ? -10 : 0,
              scale: isDragOver ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
              <FileText className="w-12 h-12 text-cyan-400" />
            </div>
          </motion.div>

          <h3 className="text-2xl font-bold text-white mb-4">
            {isDragOver ? "Release to Upload" : "Upload Energy Data"}
          </h3>

          <p className="text-cyan-300/70 mb-8 max-w-md mx-auto">
            Drag and drop your JSON energy data file here, or click to select from your quantum storage
          </p>

          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold rounded-xl
              shadow-lg shadow-cyan-400/25 hover:shadow-cyan-400/40 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Select Data File
          </motion.button>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

          {/* Holographic corners */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-400/50" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-400/50" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-400/50" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-400/50" />
        </motion.div>

        {/* Status Display */}
        <AnimatePresence>
          {uploadStatus.type && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 p-4 rounded-xl border ${
                uploadStatus.type === "success"
                  ? "bg-green-500/20 border-green-400/30 text-green-400"
                  : uploadStatus.type === "error"
                    ? "bg-red-500/20 border-red-400/30 text-red-400"
                    : "bg-cyan-500/20 border-cyan-400/30 text-cyan-400"
              }`}
            >
              <div className="flex items-center space-x-3">
                {uploadStatus.type === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
                {uploadStatus.type === "success" && <CheckCircle className="w-5 h-5" />}
                {uploadStatus.type === "error" && <AlertCircle className="w-5 h-5" />}
                <span className="font-medium">{uploadStatus.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Data Format Guide */}
      <GlassCard title="DATA FORMAT SPECIFICATIONS">
        <div className="space-y-4">
          <p className="text-cyan-300/70">Upload JSON files containing energy readings in the following format:</p>

          <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
            <pre className="text-green-400">
              {`[
  {
    "timestamp": "2024-01-01T00:00:00Z",
    "power": 750.5,
    "voltage": 240.2,
    "current": 3.12,
    "energy": 0.75
  },
  ...
]`}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center">
              <div className="text-cyan-400 font-bold text-2xl">JSON</div>
              <div className="text-cyan-300/70 text-sm">Supported Format</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-bold text-2xl">∞</div>
              <div className="text-purple-300/70 text-sm">Unlimited Size</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
