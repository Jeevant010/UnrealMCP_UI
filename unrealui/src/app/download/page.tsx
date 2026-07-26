import Navbar from "@/components/Navbar";
import { Download, ShieldCheck, TerminalSquare } from "lucide-react";

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col unreal-gradient">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-24 w-full flex flex-col items-center justify-center text-center">
        
        <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-8 text-blue-400 border border-blue-500/30">
          <Download className="w-10 h-10" />
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">Download the Relay App</h1>
        <p className="text-gray-400 text-xl mb-12 max-w-2xl">
          The Relay App is a secure, compiled binary that runs locally on your machine. It securely tunnels commands from this website directly into your Unreal Engine editor.
        </p>

        <div className="glass-panel p-8 rounded-xl border border-white/10 w-full max-w-2xl mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-2">Windows (64-bit)</h3>
              <p className="text-gray-400">Version 1.0.0 • Requires Unreal Engine 5+</p>
            </div>
            
            <a href="/downloads/UnrealMCP_Relay.exe" download className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition-all">
              <Download className="w-5 h-5" /> Download .exe
            </a>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-left flex gap-4">
             <ShieldCheck className="w-6 h-6 text-green-400 shrink-0" />
             <p className="text-sm text-gray-400">
               <strong>Securely Compiled:</strong> This executable is compiled directly to native C++ machine code using Nuitka. It cannot be easily reverse-engineered, ensuring total protection of the internal proprietary code.
             </p>
          </div>
        </div>

        <div className="text-left w-full max-w-2xl">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><TerminalSquare className="w-5 h-5"/> Installation Instructions</h4>
          <ol className="list-decimal list-inside text-gray-400 space-y-3">
            <li>Download the <code>UnrealMCP_Relay.exe</code> file above.</li>
            <li>Open your Unreal Engine project (Ensure Python Editor Script Plugin is enabled).</li>
            <li>Double click the <code>.exe</code> file to start the relay.</li>
            <li>Copy the secure Ngrok URL it generates.</li>
            <li>Paste the URL into the <a href="/ide" className="text-blue-400 hover:underline">Web IDE Settings</a>.</li>
          </ol>
        </div>

      </main>
      <footer className="py-8 text-center text-gray-500 border-t border-white/10 glass mt-auto">
        <p>© {new Date().getFullYear()} Unreal MCP.</p>
      </footer>
    </div>
  );
}
