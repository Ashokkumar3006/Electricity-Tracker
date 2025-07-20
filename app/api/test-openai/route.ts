import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ 
        error: "OpenAI API key not found", 
        details: "Please add OPENAI_API_KEY to your .env.local file" 
      }, { status: 500 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "Say 'OpenAI API is working correctly!' in exactly those words.",
    })

    return Response.json({ 
      success: true, 
      message: text,
      apiKeyPresent: !!process.env.OPENAI_API_KEY,
      apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) + "..."
    })
  } catch (error) {
    return Response.json({ 
      error: "OpenAI API test failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      apiKeyPresent: !!process.env.OPENAI_API_KEY
    }, { status: 500 })
  }
}