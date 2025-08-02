"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator, Zap, IndianRupee } from "lucide-react"
import GlassCard from "./glass-card"

export default function QuantumCalculator() {
  const [units, setUnits] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateBill = async () => {
    const unitsValue = Number.parseFloat(units)
    if (isNaN(unitsValue) || unitsValue <= 0) return

    setIsCalculating(true)

    // Simulate calculation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock TNEB calculation
    const slabs = [
      { from: 0, to: 100, rate: 0 },
      { from: 101, to: 200, rate: 2.25 },
      { from: 201, to: 500, rate: 4.5 },
      { from: 501, to: 1000, rate: 6.0 },
      { from: 1001, to: Number.POSITIVE_INFINITY, rate: 8.0 },
    ]

    let totalAmount = 0
    let remainingUnits = unitsValue
    const breakdown: any[] = []

    for (const slab of slabs) {
      if (remainingUnits <= 0) break

      const slabUnits = Math.min(remainingUnits, slab.to - slab.from + 1)
      const amount = slabUnits * slab.rate

      breakdown.push({
        from: slab.from,
        to: slab.to === Number.POSITIVE_INFINITY ? "Above" : slab.to,
        units: slabUnits,
        rate: slab.rate,
        amount: amount.toFixed(2),
      })

      totalAmount += amount
      remainingUnits -= slabUnits
    }

    setResult({
      units: unitsValue,
      total_amount: totalAmount.toFixed(2),
      breakup: breakdown,
    })

    setIsCalculating(false)
  }

  return (
    <div className="space-y-8">
      <GlassCard title="QUANTUM ENERGY BILL CALCULATOR" className="min-h-64">
        <div className="space-y-6">
          {/* Input Section */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-cyan-400 text-sm font-medium mb-2">ENERGY UNITS (kWh)</label>
              <motion.input
                type="number"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="Enter consumption units..."
                className="w-full px-4 py-3 bg-black/30 border border-cyan-400/30 rounded-xl 
                  text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none
                  transition-all duration-300"
                whileFocus={{ scale: 1.02 }}
              />
            </div>

            <motion.button
              onClick={calculateBill}
              disabled={!units || isCalculating}
              className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-black 
                font-bold rounded-xl shadow-lg shadow-cyan-400/25 hover:shadow-cyan-400/40 
                transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCalculating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Calculator className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <Zap className="w-5 h-5 inline mr-2" />
                  CALCULATE
                </>
              )}
            </motion.button>
          </div>

          {/* Calculation Animation */}
          {isCalculating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <div className="text-cyan-400 text-lg mb-4">Processing quantum calculations...</div>
              <div className="flex justify-center space-x-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-cyan-400 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </GlassCard>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Total Amount */}
          <GlassCard className="text-center py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.8 }}>
              <IndianRupee className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <div className="text-4xl font-bold text-green-400 mb-2">₹{result.total_amount}</div>
              <div className="text-cyan-300/70">Total bill for {result.units} units</div>
            </motion.div>
          </GlassCard>

          {/* Breakdown */}
          <GlassCard title="SLAB-WISE QUANTUM BREAKDOWN">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-400/30">
                    <th className="text-left py-3 text-cyan-400 font-medium">RANGE</th>
                    <th className="text-left py-3 text-cyan-400 font-medium">UNITS</th>
                    <th className="text-left py-3 text-cyan-400 font-medium">RATE</th>
                    <th className="text-left py-3 text-cyan-400 font-medium">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakup.map((slab: any, index: number) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 text-white">
                        {slab.to === "Above" ? `${slab.from}+` : `${slab.from}-${slab.to}`}
                      </td>
                      <td className="py-3 text-purple-400">{slab.units}</td>
                      <td className="py-3 text-cyan-400">₹{slab.rate.toFixed(2)}</td>
                      <td className="py-3 text-green-400 font-bold">₹{slab.amount}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* TNEB Info */}
      <GlassCard title="TNEB LT-1A TARIFF STRUCTURE">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-cyan-400 font-medium mb-3">Current Slab Rates</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">0-100 units:</span>
                <span className="text-green-400">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">101-200 units:</span>
                <span className="text-cyan-400">₹2.25/unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">201-500 units:</span>
                <span className="text-purple-400">₹4.50/unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">501-1000 units:</span>
                <span className="text-orange-400">₹6.00/unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Above 1000:</span>
                <span className="text-red-400">₹8.00/unit</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-cyan-400 font-medium mb-3">Additional Charges</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div>• Fixed charges may apply</div>
              <div>• Electricity duty included</div>
              <div>• Service tax as applicable</div>
              <div>• Meter rent (if applicable)</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
