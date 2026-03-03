import { z } from "zod"
import { ForgeTool, ForgeToolResult } from "../types"

const schema = z.object({
  nodeId: z.string().describe("ID of the node to delete")
})

export const deleteNodeTool: ForgeTool = {
  name: "delete_node",
  description: "Deletes a node and all its children recursively",
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
      message: `Deleted node and children`,
      data: {
        nodeId: parsed.nodeId,
        mutation: {
          type: "deleteNode",
          nodeId: parsed.nodeId
        }
      }
    }
  }
}