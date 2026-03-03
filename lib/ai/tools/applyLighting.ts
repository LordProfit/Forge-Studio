import { z } from "zod"
import { ForgeTool, ForgeToolResult } from "../types"
import { LightingPresets } from "@/lib/document"

const schema = z.object({
  nodeId: z.string().describe("ID of the node to update"),
  preset: z.enum(["dramatic", "soft", "noir", "flat"]).describe("Lighting preset name")
})

export const applyLightingTool: ForgeTool = {
  name: "apply_lighting",
  description: "Applies a cinematic lighting preset to a node",
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

    const lighting = LightingPresets[parsed.preset]

    return {
      success: true,
      message: `Applied ${parsed.preset} lighting to node`,
      data: {
        nodeId: parsed.nodeId,
        mutation: {
          type: "updateNode",
          nodeId: parsed.nodeId,
          updates: { lighting }
        }
      }
    }
  }
}