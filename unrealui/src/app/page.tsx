import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col unreal-gradient">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">
        <div className="inline-block mb-6 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          v1.0 is now live
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-5xl mb-8 leading-tight">
          The Ultimate <span className="unreal-text-gradient">AI Operating System</span> for Unreal Engine
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mb-12">
          Connect your favorite LLMs directly to your Unreal Engine projects. Automate workflows, generate code, and orchestrate scenes instantly with our secure, open-source relay protocol.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href="/ide" className="px-8 py-4 rounded-lg bg-white text-black hover:bg-gray-200 font-bold text-lg flex items-center justify-center gap-2 transition-all">
            Open Web IDE <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/download" className="px-8 py-4 rounded-lg glass hover:bg-white/10 font-bold text-lg flex items-center justify-center transition-all border border-white/20">
            Download Local Relay
          </Link>
        </div>
        
        <div className="flex gap-8 text-sm font-medium text-gray-400">
          <Link href="/how-it-works" className="hover:text-blue-400 transition-colors underline underline-offset-4 decoration-white/20">Read the Docs</Link>
          <Link href="/features" className="hover:text-blue-400 transition-colors underline underline-offset-4 decoration-white/20">View All Features</Link>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500 border-t border-white/10 glass mt-auto">
        <p>© {new Date().getFullYear()} Unreal MCP. Built for Creators.</p>
      </footer>
    </div>
  );
}
