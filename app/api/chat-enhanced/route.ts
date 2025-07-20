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

    // Step 1: Gather data using tools
    console.log("Step 1: Gathering energy data...")

    const dataGatheringResult = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content:
            "You are a data gathering assistant. Use the available tools to collect energy data. After gathering data, simply say 'Data collection complete.' and stop.",
        },
        ...messages,
      ],
      tools: {
        getEnergyUsageSummary,
        getDeviceConsumptionData,
        getPredictedBillAndTariff,
        getSpecificDeviceDetails,
        getGeneralEnergySuggestions,
        getWeatherData,
      },
      maxToolRoundtrips: 3,
    })

    console.log("Step 1 complete. Tool calls made:", dataGatheringResult.toolCalls?.length || 0)
    console.log("Tool results:", dataGatheringResult.toolResults?.length || 0)

    // Step 2: Generate analysis based on the gathered data
    console.log("Step 2: Generating analysis...")

    // Extract the tool results to include in the analysis prompt
    let toolResultsContext = ""
    if (dataGatheringResult.toolResults && dataGatheringResult.toolResults.length > 0) {
      toolResultsContext = "\n\nBased on the following energy data:\n"
      dataGatheringResult.toolResults.forEach((result, index) => {
        toolResultsContext += `\nTool ${index + 1} Result: ${JSON.stringify(result.result, null, 2)}\n`
      })
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "Analyze my energy usage"

    const analysisResult = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `You are an Elite Smart Energy Optimization AI Assistant. 

Provide a comprehensive energy analysis based on the data provided. Use this EXACT structure:

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

Use the actual data provided. Include specific numbers and actionable recommendations.`,
        },
        {
          role: "user",
          content: `${lastUserMessage}${toolResultsContext}`,
        },
      ],
    })

    console.log("Step 2 complete. Generated response length:", analysisResult.text.length)

    return Response.json({
      message: analysisResult.text,
      toolCallsMade: dataGatheringResult.toolCalls?.length || 0,
      toolResultsReceived: dataGatheringResult.toolResults?.length || 0,
    })
  } catch (error) {
    console.error("Enhanced Chat API Error:", error)
    return Response.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
