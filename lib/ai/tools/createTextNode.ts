import { z } from "zod"
import { ForgeTool, ForgeContext, ForgeToolResult } from "../types"
import { createTextNode, addNode, Document } from "@/lib/document"

const schema = z.object({
  x: z.number().describe("X position on canvas"),
  y: z.number().describe("Y position on canvas"),
  text: z.string().min(1).describe("Text content"),
  width: z.number().optional().default(200).describe("Width of text box"),
  height: z.number().optional().default(50).describe("Height of text box"),
  fontSize: z.number().optional().default(16).describe("Font size in pixels")
})

export const createTextNodeTool: ForgeTool = {
  name: "create_text_node",
  description: "Creates a new text node on the canvas at specified position",
  schema,

  async execute(input, context): Promise<ForgeToolResult> {
    const parsed = schema.parse(input)

    // Create the node
    const newNode = createTextNode(
      { x: parsed.x, y: parsed.y },
      { width: parsed.width, height: parsed.height },
      parsed.text
    )

    // Apply font size if specified
    if (parsed.fontSize !== 16) {
      newNode.fontSize = parsed.fontSize
    }

    // Return mutation instruction - store will apply this
    return {
      success: true,
      message: `Created text node: "${parsed.text.substring(0, 30)}${parsed.text.length > 30 ? "..." : ""}"`,
      data: {
        nodeId: newNode.id,
        node: newNode,
        mutation: {
          type: "addNode",
          node: newNode
        }
      }
    }
  }
}