import { z } from "zod"
import { ForgeTool, ForgeToolResult } from "../types"
import { createShapeNode } from "@/lib/document"

const schema = z.object({
  x: z.number().describe("X position on canvas"),
  y: z.number().describe("Y position on canvas"),
  width: z.number().default(100).describe("Width in pixels"),
  height: z.number().default(100).describe("Height in pixels"),
  shapeType: z.enum(["rect", "circle", "polygon"]).default("rect").describe("Shape type"),
  fill: z.string().default("#ffffff").describe("Fill color (hex)"),
  cornerRadius: z.number().optional().describe("Corner radius for rectangles")
})

export const createShapeNodeTool: ForgeTool = {
  name: "create_shape_node",
  description: "Creates a shape node (rectangle, circle, or polygon)",
  schema,

  async execute(input): Promise<ForgeToolResult> {
    const parsed = schema.parse(input)

    const newNode = createShapeNode(
      { x: parsed.x, y: parsed.y },
      { width: parsed.width, height: parsed.height },
      parsed.shapeType
    )

    newNode.fill = parsed.fill
    if (parsed.cornerRadius !== undefined) {
      newNode.cornerRadius = parsed.cornerRadius
    }

    return {
      success: true,
      message: `Created ${parsed.shapeType} node`,
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