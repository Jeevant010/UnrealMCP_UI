import Navbar from "@/components/Navbar";
import { Zap, Code, Layers } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col unreal-gradient">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-24 w-full">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-center">Platform Features</h1>
        <p className="text-gray-400 text-xl text-center mb-16 max-w-2xl mx-auto">
          Everything you need to automate Unreal Engine, built right into the browser.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-xl border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Instant Execution</h3>
            <p className="text-gray-400 leading-relaxed">
              Our native Python execution bridge allows the AI to run complex Editor Utility scripts instantly inside your editor. No compiling, no waiting. See results in real-time.
            </p>
          </div>
          
          <div className="glass-panel p-8 rounded-xl border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Bring Your Own LLM</h3>
            <p className="text-gray-400 leading-relaxed">
              Plug in your OpenAI, Anthropic, or local open-source models via our clean IDE interface. Maintain full privacy and control over which AI processes your commands.
            </p>
          </div>
          
          <div className="glass-panel p-8 rounded-xl border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Secure Local Relay</h3>
            <p className="text-gray-400 leading-relaxed">
              Your proprietary code stays local. Download our compiled Relay App to securely tunnel requests from the web IDE without exposing your internal network or firewalls.
            </p>
          </div>
        </div>
      </main>
      <footer className="py-8 text-center text-gray-500 border-t border-white/10 glass mt-auto">
        <p>© {new Date().getFullYear()} Unreal MCP.</p>
      </footer>
    </div>
  );
}
