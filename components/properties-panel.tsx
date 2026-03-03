"use client"

import { useCanvasStore } from "@/lib/store"
import { isTextNode, isShapeNode, isFrameNode, LightingPresets } from "@/lib/document"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Lock, Unlock, Trash2 } from "lucide-react"

export function PropertiesPanel() {
  const { present, selectedNodeIds, updateNode, deleteNode } = useCanvasStore()

  if (selectedNodeIds.length === 0) {
    return (
      <div className="w-64 bg-white border-l border-zinc-200 p-4">
        <div className="text-sm text-zinc-500 text-center">
          Select a node to edit properties
        </div>
      </div>
    )
  }

  if (selectedNodeIds.length > 1) {
    return (
      <div className="w-64 bg-white border-l border-zinc-200 p-4">
        <div className="text-sm text-zinc-500 text-center">
          {selectedNodeIds.length} nodes selected
        </div>
      </div>
    )
  }

  const node = present.nodes[selectedNodeIds[0]]
  if (!node) return null

  const updatePosition = (axis: 'x' | 'y', value: number) => {
    updateNode(node.id, {
      position: { ...node.position, [axis]: value }
    })
  }

  const updateSize = (dimension: 'width' | 'height', value: number) => {
    updateNode(node.id, {
      size: { ...node.size, [dimension]: value }
    })
  }

  const updateRotation = (value: number) => {
    updateNode(node.id, { rotation: value })
  }

  const updateOpacity = (value: number) => {
    updateNode(node.id, { opacity: value })
  }

  return (
    <div className="w-64 bg-white border-l border-zinc-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{node.name || node.type}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateNode(node.id, { locked: !node.locked })}
            >
              {node.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500"
              onClick={() => deleteNode(node.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-zinc-500 mt-1">{node.id.slice(0, 8)}...</div>
      </div>

      {/* Position */}
      <div className="p-4 border-b border-zinc-200">
        <div className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Position</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">X</Label>
            <Input
              type="number"
              value={Math.round(node.position.x)}
              onChange={(e) => updatePosition('x', Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Y</Label>
            <Input
              type="number"
              value={Math.round(node.position.y)}
              onChange={(e) => updatePosition('y', Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="p-4 border-b border-zinc-200">
        <div className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Size</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              value={Math.round(node.size.width)}
              onChange={(e) => updateSize('width', Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              value={Math.round(node.size.height)}
              onChange={(e) => updateSize('height', Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Transform */}
      <div className="p-4 border-b border-zinc-200">
        <div className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Transform</div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <Label className="text-xs">Rotation</Label>
            <span className="text-xs text-zinc-500">{Math.round(node.rotation)}°</span>
          </div>
          <Slider
            value={[node.rotation]}
            onValueChange={([v]) => updateRotation(v)}
            min={-180}
            max={180}
            step={1}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label className="text-xs">Opacity</Label>
            <span className="text-xs text-zinc-500">{Math.round(node.opacity * 100)}%</span>
          </div>
          <Slider
            value={[node.opacity]}
            onValueChange={([v]) => updateOpacity(v)}
            min={0}
            max={1}
            step={0.01}
          />
        </div>
      </div>

      {/* Type-specific properties */}
      {isTextNode(node) && (
        <div className="p-4 border-b border-zinc-200">
          <div className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Text</div>
          
          <div className="mb-3">
            <Label className="text-xs">Content</Label>
            <Input
              value={node.text}
              onChange={(e) => updateNode(node.id, { text: e.target.value })}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <Input
                type="number"
                value={node.fontSize}
                onChange={(e) => updateNode(node.id, { fontSize: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <Input
                type="color"
                value={node.color || "#000000"}
                onChange={(e) => updateNode(node.id, { color: e.target.value })}
                className="h-8 w-full"
              />
            </div>
          </div>
        </div>
      )}

      {(isShapeNode(node) || isFrameNode(node)) && (
        <div className="p-4 border-b border-zinc-200">
          <div className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Fill & Stroke</div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs">Fill</Label>
              <Input
                type="color"
                value={node.fill || "#ffffff"}
                onChange={(e) => updateNode(node.id, { fill: e.target.value })}
                className="h-8 w-full"
              />
            </div>
            <div>
              <Label className="text-xs">Stroke</Label>
              <Input
                type="color"
                value={node.stroke || "#000000"}
                onChange={(e) => updateNode(node.id, { stroke: e.target.value })}
                className="h-8 w-full"
              />
            </div>
          </div>

          {isShapeNode(node) && (
            <div>
              <Label className="text-xs">Corner Radius</Label>
              <Input
                type="number"
                value={node.cornerRadius || 0}
                onChange={(e) => updateNode(node.id, { cornerRadius: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Lighting */}
      <div className="p-4">
        <div className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Lighting</div>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(LightingPresets).map((preset) => (
            <Button
              key={preset}
              variant={node.lighting ? "outline" : "ghost"}
              size="sm"
              className="text-xs capitalize"
              onClick={() => updateNode(node.id, { lighting: LightingPresets[preset as keyof typeof LightingPresets] })}
            >
              {preset}
            </Button>
          ))}
        </div>

        {node.lighting && (
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <Label className="text-xs">Elevation</Label>
                <span className="text-xs text-zinc-500">{node.lighting.elevation}</span>
              </div>
              <Slider
                value={[node.lighting.elevation]}
                onValueChange={([v]) => updateNode(node.id, { lighting: { ...node.lighting!, elevation: v } })}
                min={0}
                max={20}
                step={1}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <Label className="text-xs">Ambient</Label>
                <span className="text-xs text-zinc-500">{Math.round(node.lighting.ambientIntensity * 100)}%</span>
              </div>
              <Slider
                value={[node.lighting.ambientIntensity]}
                onValueChange={([v]) => updateNode(node.id, { lighting: { ...node.lighting!, ambientIntensity: v } })}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}