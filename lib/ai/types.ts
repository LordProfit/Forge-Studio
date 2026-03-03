import { z } from "zod"

// AI Tool Interface - All AI mutations go through this
export interface ForgeTool<TInput = any, TResult = any> {
  name: string
  description: string
  schema: z.ZodType<TInput>
  execute: (input: TInput, context: ForgeContext) => Promise<ForgeToolResult<TResult>>
}

// Context passed to tools - safe, scoped, no secrets
export interface ForgeContext {
  documentId: string
  workspaceId: string
  userId: string
  // Document snapshot at time of execution
  documentSnapshot: {
    id: string
    version: number
    nodes: Record<string, any>
    rootIds: string[]
  }
  selectedNodeIds: string[]
}

// Standard tool result format
export interface ForgeToolResult<TData = any> {
  success: boolean
  message: string
  data?: TData
  error?: string
}

// LLM Tool Call format - strict JSON
export interface ToolCall {
  tool: string
  arguments: Record<string, any>
}

// Validate tool call format
export function validateToolCall(obj: any): obj is ToolCall {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.tool === "string" &&
    typeof obj.arguments === "object" &&
    obj.arguments !== null
  )
}