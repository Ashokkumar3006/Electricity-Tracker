import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: "OpenAI API key not configured",
          hasApiKey: false,
        },
        { status: 500 },
      )
    }

    console.log("API Key present:", !!process.env.OPENAI_API_KEY)
    console.log("API Key prefix:", process.env.OPENAI_API_KEY?.substring(0, 10) + "...")

    // Simple test without tools first
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: message || "Say hello and confirm you're working",
    })

    console.log("AI Response:", result.text)

    return Response.json({
      success: true,
      response: result.text,
      hasApiKey: true,
      usage: result.usage,
    })
  } catch (error) {
    console.error("Debug Chat Error:", error)
    return Response.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
        hasApiKey: !!process.env.OPENAI_API_KEY,
      },
      { status: 500 },
    )
  }
}
