import { NextRequest, NextResponse } from "next/server"
import { executeAIToolCall, parseToolCall, getSystemPrompt } from "@/lib/ai/orchestrator"
import { useCanvasStore } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toolCall, context } = body

    // Validate tool call
    const validatedCall = parseToolCall(JSON.stringify(toolCall))
    if (!validatedCall) {
      return NextResponse.json(
        { success: false, error: "Invalid tool call format" },
        { status: 400 }
      )
    }

    // Execute tool
    const result = await executeAIToolCall(validatedCall, context)

    // If successful, return mutation for client to apply
    return NextResponse.json(result)

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return system prompt for LLM
  return NextResponse.json({
    systemPrompt: getSystemPrompt()
  })
}