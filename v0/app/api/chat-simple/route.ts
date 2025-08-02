import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import {
  getEnergyUsageSummary,
  getDeviceConsumptionData,
  getPredictedBillAndTariff,
  getSpecificDeviceDetails,
  getGeneralEnergySuggestions,
  getWeatherData,
} from "@/lib/ai-tools"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages,
      tools: {
        getEnergyUsageSummary,
        getDeviceConsumptionData,
        getPredictedBillAndTariff,
        getSpecificDeviceDetails,
        getGeneralEnergySuggestions,
        getWeatherData,
      },
      maxToolRoundtrips: 5,
      system: `You are an Elite Smart Energy Optimization AI Assistant. When users ask about energy optimization, you MUST:

1. Use your tools to gather real data first
2. Provide a complete analysis after getting the tool results
3. Never stop at just tool calls - always synthesize the data into actionable insights

Follow this structure for energy optimization queries:

**⚡ EXECUTIVE SUMMARY**
- Current efficiency status with specific percentages
- Primary optimization opportunity with cost impact
- Total potential monthly savings in ₹

**📊 DEEP DIVE ANALYSIS**
- Peak usage period analysis with specific kWh numbers
- Device performance breakdown with efficiency ratings
- Highest consuming devices with power ratings

**🎯 STRATEGIC RECOMMENDATIONS**

**Phase 1: Immediate Wins (0-30 days)**
1. Smart Scheduling - Specific actions with ₹/month savings
2. Phantom Load Elimination - Devices to target
3. Temperature Optimization - Degree changes with savings

**Phase 2: System Optimization (1-3 months)**
1. Device Upgrades - Specific recommendations with ROI
2. Automation Implementation - Smart controls
3. Maintenance Actions - Specific tasks

**📈 PERFORMANCE METRICS**
- Current System Efficiency: X/100
- Monthly Savings Opportunity: ₹X
- Annual ROI: X%

**💡 Next Steps**: [Specific actionable item]
**🎯 Quick Win**: [24-hour action]

Always use real data from your tools. Never make up numbers.`,
    })

    return Response.json({ message: result.text })
  } catch (error) {
    console.error("Chat Simple API Error:", error)
    return Response.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
