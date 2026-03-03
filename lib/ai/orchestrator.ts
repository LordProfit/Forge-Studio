import { getTool, toolRegistry } from "./registry"
import { ForgeContext, ToolCall, validateToolCall, ForgeToolResult } from "./types"
import { registerAllTools } from "./tools"

// Initialize tools
registerAllTools()

// Single-step execution gateway
export async function executeAIToolCall(
  toolCall: ToolCall,
  context: ForgeContext
): Promise<ForgeToolResult> {
  const tool = getTool(toolCall.tool)

  if (!tool) {
    return {
      success: false,
      message: `Tool "${toolCall.tool}" not found`,
      error: "TOOL_NOT_FOUND",
      data: { availableTools: Object.keys(toolRegistry) }
    }
  }

  try {
    return await tool.execute(toolCall.arguments, context)
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Tool execution failed",
      error: "EXECUTION_ERROR"
    }
  }
}

// Parse and validate LLM response
export function parseToolCall(response: string): ToolCall | null {
  try {
    const parsed = JSON.parse(response)
    if (validateToolCall(parsed)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

// Get system prompt for LLM
export function getSystemPrompt(): string {
  return `You are Forge AI, a creative assistant that helps users build designs.

You can ONLY use the following tools:
${Object.values(toolRegistry).map(t => `- ${t.name}: ${t.description}`).join("\n")}

RULES:
1. Respond ONLY with valid JSON in this exact format:
   {"tool": "tool_name", "arguments": {...}}

2. Do NOT include any other text, explanations, or markdown.

3. Choose the single best tool for the user's request.

4. Validate all arguments match the tool's schema.

5. If you cannot fulfill the request with available tools, respond:
   {"tool": "error", "arguments": {"message": "Cannot do that"}}`
}

// Re-export
export { toolRegistry, getTool } from "./registry"
export * from "./types"