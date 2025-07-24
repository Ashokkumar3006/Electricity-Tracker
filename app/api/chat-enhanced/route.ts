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

**RESPONSE GUIDELINES:**

For SIMPLE QUESTIONS (like "What's my peak usage time?", "Which device uses most power?"):
- Give a direct, concise answer
- Example: "Your peak usage time is in the afternoon (11 AM - 4 PM), consuming 192.85 kWh during this period."

For COMPREHENSIVE ANALYSIS REQUESTS (like "How can I save energy?", "Analyze my energy usage", "Optimize my electricity bill"):
- Use the detailed format below with real data (no placeholders)

**DETAILED ANALYSIS FORMAT (only when requested):**

**⚡ EXECUTIVE SUMMARY**
- Current system efficiency: [actual %]
- Peak usage period: [actual period] consuming [actual kWh]
- Highest consuming device: [actual device] at [actual kWh]
- Predicted monthly bill: ₹[actual amount]

**📊 DEVICE PERFORMANCE ANALYSIS**
[List each device with real data]
- [Device]: [actual kWh] total, [actual %] efficiency, [actual status]
- Key insight: [specific recommendation]

**🎯 IMMEDIATE ACTION PLAN**

**Phase 1: Quick Wins (This Week)**
1. [Specific action with real savings] → Save ₹[actual amount]/month
2. [Specific action with real savings] → Save ₹[actual amount]/month
3. [Specific action with real savings] → Save ₹[actual amount]/month

**Phase 2: Smart Optimization (Next Month)**
1. [Device upgrade/automation] → ₹[actual amount]/month savings
2. [Scheduling optimization] → ₹[actual amount]/month savings
3. [Efficiency improvement] → [actual %] better performance

**💰 FINANCIAL IMPACT**
- Current monthly estimate: ₹[actual predicted amount]
- Potential savings: ₹[actual amount]/month ([actual %] reduction)
- Annual savings opportunity: ₹[actual amount]

**🚀 NEXT STEPS**
- Immediate: [specific 24-hour action]
- This week: [specific weekly goal]
- This month: [specific monthly target]

**CRITICAL RULES:**
1. NEVER use placeholders like [X], [Y], [amount] - always use real data
2. For simple questions, give simple answers
3. Only use the detailed format when comprehensive analysis is requested
4. Always base responses on actual tool data, not assumptions`,
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
