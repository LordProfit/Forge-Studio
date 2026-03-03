import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg" />
            <span className="font-bold text-xl">Forge Studio</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition">
              Dashboard
            </Link>
            <Button variant="outline" className="border-zinc-700">
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold mb-6">
            AI-Native Creative OS
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Figma-level canvas + cinematic lighting + structured AI execution. 
            Built for creators who think in systems.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                Open Canvas
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-zinc-700">
              Learn More
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <h3 className="font-semibold mb-2">Structured Canvas</h3>
              <p className="text-sm text-zinc-400">Figma-level document model with deterministic rendering and diff-based updates.</p>
            </div>
            
            <div className="p-6 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <h3 className="font-semibold mb-2">Cinematic Lighting</h3>
              <p className="text-sm text-zinc-400">2D lighting system with elevation, shadows, and rim lighting. No 3D required.</p>
            </div>
            
            <div className="p-6 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <h3 className="font-semibold mb-2">AI Orchestration</h3>
              <p className="text-sm text-zinc-400">Structured agent core with tool registry. AI manipulates documents safely.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}