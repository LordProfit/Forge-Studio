import { z } from "zod"
import { ForgeTool, ForgeToolResult } from "../types"

const schema = z.object({
  nodeId: z.string().describe("ID of the node to update"),
  updates: z.object({
    position: z.object({
      x: z.number(),
      y: z.number()
    }).optional(),
    size: z.object({
      width: z.number(),
      height: z.number()
    }).optional(),
    rotation: z.number().optional(),
    opacity: z.number().min(0).max(1).optional(),
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional()
  }).describe("Properties to update")
})

export const updateNodeTool: ForgeTool = {
  name: "update_node",
  description: "Updates properties of an existing node (position, size, color, etc.)",
  schema,

  async execute(input, context): Promise<ForgeToolResult> {
    const parsed = schema.parse(input)

    // Check if node exists
    const node = context.documentSnapshot.nodes[parsed.nodeId]
    if (!node) {
      return {
        success: false,
        message: `Node not found: ${parsed.nodeId}`,
        error: "NODE_NOT_FOUND"
      }
    }

    return {
      success: true,
      message: `Updated node properties`,
      data: {
        nodeId: parsed.nodeId,
        mutation: {
          type: "updateNode",
          nodeId: parsed.nodeId,
          updates: parsed.updates
        }
      }
    }
  }
}