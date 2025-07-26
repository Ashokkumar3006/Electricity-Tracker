import { streamText } from "ai"
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
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const result = await streamText({
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
      toolChoice: "auto",
      system: `You are an Elite Smart Energy Optimization AI Assistant. 

CRITICAL: You MUST provide a complete analysis after using tools. Never stop at just tool calls.

When users ask about energy optimization or usage, follow this EXACT process:
1. Use your tools to gather data
2. IMMEDIATELY after getting tool results, provide a comprehensive response
3. NEVER end your response after tool calls - always continue with analysis

Your response MUST follow this structure:

**⚡ EXECUTIVE SUMMARY**
- Current system efficiency: [calculate from device data]%
- Peak usage period: [from peak data] consuming [X] kWh
- Highest consuming device: [device name] at [X] kWh
- Predicted monthly bill: ₹[amount]

**📊 DEVICE PERFORMANCE ANALYSIS**
[For each major device, provide:]
- [Device]: [X] kWh total, [Y]% efficiency, [status]
- Key insight: [specific recommendation]

**🎯 IMMEDIATE ACTION PLAN**

**Phase 1: Quick Wins (This Week)**
1. [Specific action] → Save ₹[X]/month
2. [Specific action] → Save ₹[X]/month
3. [Specific action] → Save ₹[X]/month

**Phase 2: Smart Optimization (Next Month)**
1. [Device upgrade/automation] → ₹[X]/month savings
2. [Scheduling optimization] → ₹[X]/month savings
3. [Efficiency improvement] → [X]% better performance

**💰 FINANCIAL IMPACT**
- Current monthly estimate: ₹[predicted bill amount]
- Potential savings: ₹[X]/month ([Y]% reduction)
- Annual savings opportunity: ₹[X]

**🚀 NEXT STEPS**
- Immediate: [specific 24-hour action]
- This week: [specific weekly goal]
- This month: [specific monthly target]

REMEMBER: Always use the actual data from your tools. Include specific numbers, percentages, and actionable recommendations. Make every suggestion concrete and measurable.`,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API Error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
