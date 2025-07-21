"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, IndianRupee, AlertCircle, Loader2, Info } from "lucide-react"

interface BillCalculatorProps {
  connection: any
}

interface BillBreakup {
  from: number
  to: number | string
  units: number
  rate: number
  amount: number
}

interface BillData {
  units: number
  total_amount: number
  breakup: BillBreakup[]
}

export default function BillCalculator({ connection }: BillCalculatorProps) {
  const [units, setUnits] = useState("")
  const [billData, setBillData] = useState<BillData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const calculateBill = async () => {
    const unitsValue = Number.parseFloat(units)

    if (isNaN(unitsValue) || unitsValue <= 0) {
      setError("Please enter a valid number of units (greater than 0)")
      return
    }

    if (unitsValue > 10000) {
      setError("Units seem too high. Please check your input.")
      return
    }

    setIsLoading(true)
    setError("")
    setBillData(null)

    try {
      const response = await fetch(`http://localhost:5000/api/bill?units=${unitsValue}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setBillData(data)
    } catch (error) {
      setError(`Error calculating bill: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      calculateBill()
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bill Calculator</h1>
        <p className="text-gray-600">Calculate your electricity bill based on TNEB LT-1A tariff structure</p>
      </div>

      {/* Calculator Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>TNEB Bill Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="units" className="text-sm font-medium">
                  Units Consumed (kWh)
                </Label>
                <Input
                  id="units"
                  type="number"
                  placeholder="Enter units consumed"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  onKeyPress={handleKeyPress}
                  min="0"
                  step="0.1"
                  disabled={!connection.isConnected || isLoading}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={calculateBill}
                disabled={!connection.isConnected || isLoading || !units}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IndianRupee className="h-4 w-4 mr-2" />
                )}
                Calculate Bill
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">TNEB LT-1A Tariff</p>
                    <p>Domestic tariff structure for residential consumers in Tamil Nadu</p>
                  </div>
                </div>
              </div>

              {!connection.isConnected && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Backend connection required for bill calculation.</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {billData && (
        <div className="space-y-6">
          {/* Total Bill Amount */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <IndianRupee className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bill Amount</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">₹{billData.total_amount}</div>
                <p className="text-blue-700">for {billData.units} units consumed</p>
              </div>
            </CardContent>
          </Card>

          {/* Bill Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Slab-wise Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-semibold text-gray-900">Units Range</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Units Used</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Rate (₹/unit)</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.breakup.map((slab, index) => {
                      const unitsRange = slab.to === "Above" ? `${slab.from}+` : `${slab.from}-${slab.to}`
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 text-gray-700">{unitsRange}</td>
                          <td className="p-4 text-gray-900 font-medium">{slab.units}</td>
                          <td className="p-4 text-gray-700">₹{slab.rate.toFixed(2)}</td>
                          <td className="p-4 text-gray-900 font-semibold">₹{slab.amount}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
