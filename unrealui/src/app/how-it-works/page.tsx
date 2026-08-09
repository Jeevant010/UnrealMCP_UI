import Navbar from "@/components/Navbar";
import { TerminalSquare, Settings, Play } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col unreal-gradient">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-24 w-full">
        <div className="text-center mb-24">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">How It Works</h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            A simple 3-step process to connect your local Unreal Engine to the cloud IDE.
          </p>
        </div>

        <div className="space-y-32">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 font-bold text-lg mb-2">1</div>
              <h3 className="text-3xl font-bold">Start the Local Relay</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                First, download and run the Unreal MCP Relay App on the same computer where Unreal Engine is running. It will generate a secure, private Ngrok URL for you. 
              </p>
              <div className="p-4 bg-black/50 rounded-lg border border-white/5 font-mono text-sm text-gray-300">
                <span className="text-blue-400">$</span> ./UnrealMCP_Relay.exe<br/>
                <span className="text-green-400">✓</span> Server running at: https://your-id.ngrok.app/sse
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-[16/10] bg-[#18181b] rounded-2xl border border-white/15 overflow-hidden shadow-2xl relative group">
                <img 
                  src="/screenshots/terminal-relay.png" 
                  alt="Unreal MCP Relay Terminal"
                  className="w-full h-full object-cover text-xs text-gray-500"
                  onError={(e) => {
                    // Fallback if image not uploaded yet
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-500">
                  <TerminalSquare className="w-16 h-16 mb-2 text-blue-400/50" />
                  <span className="text-xs font-mono">Drop image at: <code>public/screenshots/terminal-relay.png</code></span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 font-bold text-lg mb-2">2</div>
              <h3 className="text-3xl font-bold">Configure Your Workspace</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Open the Web IDE right here in your browser. Click on the <strong>Settings</strong> panel and paste in your generated Ngrok Endpoint.
              </p>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-3"><Settings className="w-5 h-5 text-purple-400" /> Securely stored in your browser session</li>
                <li className="flex items-center gap-3"><Settings className="w-5 h-5 text-purple-400" /> Supports OpenAI, Anthropic, and Groq models</li>
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-[16/10] bg-[#18181b] rounded-2xl border border-white/15 overflow-hidden shadow-2xl relative group">
                <img 
                  src="/screenshots/workspace-settings.png" 
                  alt="Workspace Settings UI"
                  className="w-full h-full object-cover text-xs text-gray-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-500">
                  <Settings className="w-16 h-16 mb-2 text-purple-400/50" />
                  <span className="text-xs font-mono">Drop image at: <code>public/screenshots/workspace-settings.png</code></span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-600 font-bold text-lg mb-2">3</div>
              <h3 className="text-3xl font-bold">Execute and Automate</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Type a natural language prompt in the Web IDE (e.g. <em>"Spawn 3 point lights at 0,0,200"</em>) and click <strong>Execute</strong>. The command is securely tunneled to your local machine and executed immediately inside Unreal Engine.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-[16/10] bg-[#18181b] rounded-2xl border border-white/15 overflow-hidden shadow-2xl relative group">
                <img 
                  src="/screenshots/unreal-engine-live.png" 
                  alt="Unreal Engine Live Execution"
                  className="w-full h-full object-cover text-xs text-gray-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-500">
                  <Play className="w-16 h-16 mb-2 text-green-400/50" />
                  <span className="text-xs font-mono">Drop image at: <code>public/screenshots/unreal-engine-live.png</code></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="py-8 text-center text-gray-500 border-t border-white/10 glass mt-auto">
        <p>© {new Date().getFullYear()} Unreal MCP.</p>
      </footer>
    </div>
  );
}
