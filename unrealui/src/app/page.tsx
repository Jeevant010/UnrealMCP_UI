import Link from "next/link";
import { ArrowRight, Code, Zap, Layers } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col unreal-gradient">
      <header className="px-6 py-4 flex justify-between items-center glass border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">U</div>
          <span className="font-bold text-xl tracking-tight">Unreal MCP</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
          <Link href="/ide" className="text-blue-400 hover:text-blue-300 transition-colors">Open IDE</Link>
        </nav>
        <div>
          <Link href="/ide" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            Launch Workspace
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">
        <div className="inline-block mb-6 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          v1.0 is now live
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl mb-8 leading-tight">
          The Ultimate <span className="unreal-text-gradient">AI Operating System</span> for Unreal Engine
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12">
          Connect your favorite LLMs directly to your Unreal Engine projects. Automate workflows, generate code, and orchestrate scenes instantly with our secure, open-source relay protocol.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-24">
          <Link href="/ide" className="px-8 py-4 rounded-lg bg-white text-black hover:bg-gray-200 font-bold text-lg flex items-center justify-center gap-2 transition-all">
            Open Web IDE <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="https://github.com/your-repo/Unreal-MCP/releases/latest" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-lg glass hover:bg-white/10 font-bold text-lg flex items-center justify-center transition-all border border-white/20">
            Download Local Relay App
          </a>
        </div>

        <div id="features" className="w-full max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-left px-4">
          <div className="glass-panel p-6 rounded-xl border border-white/10">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Execution</h3>
            <p className="text-gray-400">Our native Python execution bridge allows the AI to run complex Editor Utility scripts instantly inside your editor.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-white/10">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Bring Your Own LLM</h3>
            <p className="text-gray-400">Plug in your OpenAI, Anthropic, or local open-source models via our clean IDE interface. Full privacy and control.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-white/10">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 text-green-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Local Relay</h3>
            <p className="text-gray-400">Your code stays local. Download our compiled Relay App to securely tunnel requests without exposing your internal network.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500 border-t border-white/10 glass mt-auto">
        <p>© {new Date().getFullYear()} Unreal MCP. Open Source and Built for Creators.</p>
      </footer>
    </div>
  );
}
