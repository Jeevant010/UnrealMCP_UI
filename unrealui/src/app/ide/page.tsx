"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Settings, ArrowLeft, Loader2, Send, Sparkles, 
  Terminal, CheckCircle2, AlertCircle, Bot, User, 
  ChevronDown, ChevronUp, Copy, Check, Cpu, ShieldCheck,
  Maximize2, Minus, X, Activity, Server, Radio
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  toolCall?: {
    name: string;
    script: string;
    output?: string;
    status: "running" | "success" | "error";
  };
}

export default function IDEPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [showAntigravityModal, setShowAntigravityModal] = useState(false);
  const [ngrokUrl, setNgrokUrl] = useState("http://localhost:8000/sse");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [copiedConfig, setCopiedConfig] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Unreal MCP OS Environment Initialized. I am your direct AI Technical Artist for Unreal Engine 5. Enter any prompt below to manipulate your scene live.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  const toggleToolExpand = (id: string) => {
    setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyAntigravityConfig = () => {
    const config = JSON.stringify({
      mcpServers: {
        "unreal-engine": {
          command: "C:/path/to/UnrealMCP_Relay.exe",
          args: ["--stdio"]
        }
      }
    }, null, 2);

    navigator.clipboard.writeText(config);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim() || isProcessing) return;

    if (!ngrokUrl) {
      setShowSettings(true);
      return;
    }

    const userPromptText = prompt.trim();
    const userMessageId = Date.now().toString();
    setPrompt("");

    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        sender: "user",
        text: userPromptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsProcessing(true);
    const assistantMsgId = (Date.now() + 1).toString();

    setMessages(prev => [
      ...prev,
      {
        id: assistantMsgId,
        sender: "assistant",
        text: `Processing prompt via ${selectedModel.toUpperCase()}...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall: {
          name: "execute_python_in_editor",
          script: "# Generating & executing Python script in Unreal Engine...",
          status: "running"
        }
      }
    ]);

    try {
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: ngrokUrl,
          prompt: userPromptText,
          apiKey: apiKey,
          model: selectedModel
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: data.explanation || "Successfully executed your request in Unreal Engine!",
                  toolCall: {
                    name: "execute_python_in_editor",
                    script: data.executedScript || `# Prompt: ${userPromptText}`,
                    output: data.result || "Command executed in Unreal Editor successfully.",
                    status: "success"
                  }
                }
              : msg
          )
        );
      } else {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: `❌ Could not complete request in Unreal Engine. Please check connection.`,
                  toolCall: {
                    name: "execute_python_in_editor",
                    script: data.executedScript || "# Attempted script",
                    output: data.error,
                    status: "error"
                  }
                }
              : msg
          )
        );
      }
    } catch (err: any) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: `❌ Relay Error: Ensure UnrealMCP_Relay.exe and Ngrok are active.`,
                toolCall: {
                  name: "execute_python_in_editor",
                  script: "# Network failure",
                  output: err.message,
                  status: "error"
                }
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0b0c10] text-[#c5c6c7] overflow-hidden font-mono border-t-2 border-blue-600 select-none">
      
      {/* Ubuntu / Enterprise OS Title Bar */}
      <header className="h-10 flex justify-between items-center px-4 bg-[#1f2833] border-b border-white/10 text-xs z-20">
        <div className="flex items-center gap-3">
          {/* OS Window Controls */}
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 cursor-pointer transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 cursor-pointer transition-colors" />
          </div>

          <Link href="/" className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>

          <div className="font-semibold flex items-center gap-2 text-white">
            <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center font-black text-[10px] text-white">
              U
            </div>
            <span>Unreal Engine MCP Workstation OS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Model Pill */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/40 border border-blue-500/30 px-2.5 py-1 rounded text-[11px] text-blue-400">
            <Radio className="w-3 h-3 animate-pulse text-blue-400" />
            <span>MODEL: {selectedModel.toUpperCase()}</span>
          </div>

          {/* Antigravity Integration Button */}
          <button
            onClick={() => setShowAntigravityModal(true)}
            className="px-2.5 py-1 rounded bg-purple-900/40 hover:bg-purple-800/60 text-[11px] font-semibold text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Connect Antigravity / Cursor</span>
          </button>

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-2.5 py-1 rounded text-[11px]">
            <span className={`w-2 h-2 rounded-full ${ngrokUrl ? "bg-green-400 animate-pulse" : "bg-yellow-500"}`} />
            <span className="text-gray-300">
              {ngrokUrl ? "RELAY LIVE" : "OFFLINE"}
            </span>
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${
              showSettings ? "bg-white/20 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
            title="System Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Antigravity / Cursor Integration Modal */}
      {showAntigravityModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f2833] border border-white/15 rounded-xl max-w-xl w-full p-6 shadow-2xl relative text-sans">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-white">
                <Cpu className="w-5 h-5 text-purple-400" /> Antigravity & IDE Integration Setup
              </h3>
              <button 
                onClick={() => setShowAntigravityModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              To use this Unreal Engine MCP directly inside <strong>Antigravity</strong>, <strong>Claude Desktop</strong>, or <strong>Cursor IDE</strong>, add this JSON configuration:
            </p>

            <div className="bg-black/90 p-4 rounded-lg border border-white/10 font-mono text-xs text-purple-300 relative mb-4">
              <button
                onClick={copyAntigravityConfig}
                className="absolute top-3 right-3 p-1.5 rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors flex items-center gap-1 text-[11px]"
              >
                {copiedConfig ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedConfig ? "Copied!" : "Copy JSON"}
              </button>
              <pre className="overflow-x-auto">{`{
  "mcpServers": {
    "unreal-engine": {
      "command": "C:/path/to/UnrealMCP_Relay.exe",
      "args": ["--stdio"]
    }
  }
}`}</pre>
            </div>

            <div className="text-xs text-gray-400 space-y-2 mb-6">
              <p>📍 <strong>Antigravity / Claude Config Path</strong>: <code>%APPDATA%/Claude/claude_desktop_config.json</code></p>
              <p>📍 <strong>Cursor IDE</strong>: Settings → Features → MCP → Add Server (Type: <code>command</code>)</p>
            </div>

            <button
              onClick={() => setShowAntigravityModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main OS Workstation Body */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* System Settings Drawer */}
        {showSettings && (
          <div className="absolute inset-y-0 right-0 w-80 bg-[#1f2833] border-l border-white/15 p-6 z-30 shadow-2xl flex flex-col gap-6 text-sans">
            <div>
              <h3 className="text-sm font-bold mb-1 flex items-center gap-2 text-white">
                <Settings className="w-4 h-4 text-blue-400" /> System & Model Settings
              </h3>
              <p className="text-xs text-gray-400">Configure LLM keys & Relay endpoints.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-300">Ngrok / SSE Endpoint URL</label>
              <input
                type="text"
                placeholder="https://xxxx.ngrok.app/sse"
                value={ngrokUrl}
                onChange={e => setNgrokUrl(e.target.value)}
                className="w-full bg-black/70 border border-white/15 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 text-white"
              />
              <p className="text-[10px] text-gray-500">The SSE tunnel URL generated by <code>UnrealMCP_Relay.exe</code>.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-300">AI Model Provider</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full bg-black/70 border border-white/15 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white"
              >
                <option value="gpt-4o">OpenAI GPT-4o (Default Connected)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Fast)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="groq-llama">Groq Llama 3.3 70B (Ultra Fast)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-300">OpenAI / Groq API Key (Optional)</label>
              <input
                type="password"
                placeholder="sk-... or gsk-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-black/70 border border-white/15 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 text-white"
              />
              <p className="text-[10px] text-gray-500">Passes directly to LLM endpoint. Leave empty to use system default engine.</p>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white transition-all"
            >
              Apply Settings
            </button>
          </div>
        )}

        {/* Central Terminal / Chat Stream */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-8 h-8 rounded bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl flex flex-col gap-2 ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  
                  {/* Text Bubble */}
                  <div
                    className={`px-4 py-3 rounded-lg text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                        : "bg-[#1f2833] border border-white/10 text-gray-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Clean OS Tool Execution Badge */}
                  {msg.toolCall && (
                    <div className="w-full bg-[#151c24] rounded border border-white/10 overflow-hidden text-xs mt-1">
                      <div className="px-3.5 py-2 bg-black/40 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {msg.toolCall.status === "running" && <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />}
                          {msg.toolCall.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                          {msg.toolCall.status === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                          <span className="text-gray-300 font-bold">⚡ EXECUTING: {msg.toolCall.name}</span>
                        </div>
                        <button
                          onClick={() => toggleToolExpand(msg.id)}
                          className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          {expandedTools[msg.id] ? "[Hide Payload]" : "[Inspect Code & Log]"}
                        </button>
                      </div>

                      {expandedTools[msg.id] && (
                        <div className="p-3 bg-black/90 font-mono text-[11px] border-t border-white/10 space-y-2">
                          {msg.toolCall.script && (
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Generated Python:</div>
                              <pre className="p-2 bg-black rounded text-blue-300 text-[10px] overflow-x-auto whitespace-pre-wrap">
                                {msg.toolCall.script}
                              </pre>
                            </div>
                          )}
                          {msg.toolCall.output && (
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Unreal Engine Stdout:</div>
                              <pre className="p-2 bg-black rounded text-green-400 text-[10px] overflow-x-auto whitespace-pre-wrap">
                                {msg.toolCall.output}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-gray-500 px-1">{msg.timestamp}</span>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded bg-white/10 border border-white/15 flex items-center justify-center text-gray-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom OS Command Prompt Bar */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="relative bg-[#1f2833] rounded-lg border border-white/20 focus-within:border-blue-500/80 transition-all p-2 flex items-center gap-3">
              <span className="text-blue-400 text-xs font-bold pl-2">unreal-mcp &gt;</span>
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendPrompt()}
                placeholder="Enter prompt (e.g. 'Spawn 3 point lights in a row' or 'Create a CineCameraActor')..."
                className="flex-1 bg-transparent px-2 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
              />
              <button
                onClick={handleSendPrompt}
                disabled={isProcessing || !prompt.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>EXECUTE</span>
              </button>
            </div>
            <div className="flex justify-between items-center px-2 mt-2 text-[10px] text-gray-500 font-mono">
              <span>CONNECTED ENGINE: {selectedModel.toUpperCase()}</span>
              <span>UNREAL ENGINE 5 LIVE BRIDGE</span>
            </div>
          </div>
        </div>

      </div>

      {/* OS Bottom Status Bar */}
      <footer className="h-6 bg-[#1f2833] border-t border-white/10 px-4 flex justify-between items-center text-[10px] text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-green-400" /> SYSTEM ACTIVE</span>
          <span className="flex items-center gap-1.5"><Server className="w-3 h-3 text-blue-400" /> PORT 8000</span>
        </div>
        <div>
          <span>UNREAL MCP PRO WORKSTATION v1.0</span>
        </div>
      </footer>
    </div>
  );
}
