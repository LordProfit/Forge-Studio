import { registerTool } from "../registry"
import { createTextNodeTool } from "./createTextNode"
import { createShapeNodeTool } from "./createShapeNode"
import { applyLightingTool } from "./applyLighting"
import { updateNodeTool } from "./updateNode"
import { deleteNodeTool } from "./deleteNode"

// Register all tools
export function registerAllTools() {
  registerTool(createTextNodeTool)
  registerTool(createShapeNodeTool)
  registerTool(applyLightingTool)
  registerTool(updateNodeTool)
  registerTool(deleteNodeTool)
}

// Re-export for convenience
export { createTextNodeTool } from "./createTextNode"
export { createShapeNodeTool } from "./createShapeNode"
export { applyLightingTool } from "./applyLighting"
export { updateNodeTool } from "./updateNode"
export { deleteNodeTool } from "./deleteNode"