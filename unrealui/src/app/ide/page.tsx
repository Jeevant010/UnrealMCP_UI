"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, Play, Terminal, ArrowLeft, Loader2, Key } from "lucide-react";

export default function IDEPage() {
  const [showSettings, setShowSettings] = useState(true); // Show by default to prompt user
  const [ngrokUrl, setNgrokUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [code, setCode] = useState("import unreal\n\n# Example: Print all actors\nactors = unreal.EditorLevelLibrary.get_all_level_actors()\nfor a in actors:\n    print(a.get_name())\n");
  const [output, setOutput] = useState<string[]>(["[System] Ready. Configure settings to connect."]);
  const [isRunning, setIsRunning] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const handleRun = async () => {
    if (!ngrokUrl) {
      setOutput(prev => [...prev, "[Error] Ngrok URL is not configured."]);
      setShowSettings(true);
      return;
    }

    setIsRunning(true);
    setOutput(prev => [...prev, `[Running] Executing script on ${ngrokUrl}...`]);

    try {
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ngrokUrl, script: code }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOutput(prev => [...prev, `[Success]\n${data.result}`]);
      } else {
        setOutput(prev => [...prev, `[Error] ${data.error}`]);
      }
    } catch (err: any) {
      setOutput(prev => [...prev, `[Network Error] ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Navbar */}
      <header className="h-14 flex justify-between items-center px-4 border-b border-border glass relative z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="font-semibold flex items-center gap-2">
             <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center font-bold text-white text-xs">U</div>
             Workspace
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md flex items-center gap-2 transition-colors ${showSettings ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(22,163,74,0.3)]"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Run Script
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Settings Overlay / Panel */}
        {showSettings && (
          <div className="absolute inset-y-0 right-0 w-80 glass-panel border-l border-white/10 p-6 z-20 shadow-2xl flex flex-col gap-6 transform transition-transform">
            <div>
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Key className="w-5 h-5 text-blue-400"/> Connections</h3>
              <p className="text-xs text-gray-400 mb-4">Configure your local relay and LLM keys.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Ngrok MCP Endpoint</label>
              <input 
                type="text" 
                placeholder="https://1234.ngrok.app/sse" 
                value={ngrokUrl}
                onChange={(e) => setNgrokUrl(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-gray-500">The secure URL pointing to your local Unreal-MCP server.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">OpenAI / Anthropic API Key</label>
              <input 
                type="password" 
                placeholder="sk-..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-gray-500">Required if you want the AI to generate scripts for you.</p>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-medium transition-colors"
            >
              Save & Close
            </button>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-[#1e1e1e] border-b border-border relative">
            <div className="absolute top-0 left-0 w-full h-8 bg-black/40 flex items-center px-4 text-xs font-mono text-gray-400 border-b border-white/5">
              script.py
            </div>
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full bg-transparent p-4 pt-12 text-sm font-mono text-[#d4d4d4] focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Console Area */}
          <div className="h-64 bg-black flex flex-col border-t border-white/10">
            <div className="h-8 bg-[#18181b] flex items-center px-4 gap-2 text-xs font-medium text-gray-400 border-b border-white/5">
              <Terminal className="w-3 h-3" /> Output Console
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-green-400 leading-relaxed">
              {output.map((line, i) => (
                <div key={i} className="mb-2 whitespace-pre-wrap">{line}</div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
