import { ForgeTool } from "./types"

// Global tool registry - all tools must be registered here
export const toolRegistry: Record<string, ForgeTool> = {}

export function registerTool(tool: ForgeTool) {
  if (toolRegistry[tool.name]) {
    throw new Error(`Tool "${tool.name}" already registered`)
  }
  toolRegistry[tool.name] = tool
}

export function getTool(name: string): ForgeTool | undefined {
  return toolRegistry[name]
}

export function listTools(): string[] {
  return Object.keys(toolRegistry)
}

export function getToolDescriptions(): string {
  return Object.values(toolRegistry)
    .map(tool => `- ${tool.name}: ${tool.description}`)
    .join("\n")
}