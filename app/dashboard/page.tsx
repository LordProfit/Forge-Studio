import { ForgeCanvas } from "@/components/forge-canvas"
import { ForgeToolbar } from "@/components/forge-toolbar"
import { PropertiesPanel } from "@/components/properties-panel"

export default function DashboardPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ForgeToolbar />
      <div className="flex-1 relative">
        <ForgeCanvas />
      </div>
      <PropertiesPanel />
    </div>
  )
}