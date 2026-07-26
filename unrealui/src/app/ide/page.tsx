"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Settings, ArrowLeft, Loader2, Send, Sparkles, 
  Terminal, CheckCircle2, AlertCircle, Bot, User, 
  ChevronDown, ChevronUp, Copy, Check, Cpu, ShieldCheck
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
  const [selectedModel, setSelectedModel] = useState("antigravity-auto");
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [copiedConfig, setCopiedConfig] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Welcome to Unreal MCP AI Studio! I am your direct natural language assistant for Unreal Engine. Describe what you want to create or modify in your level, and I will execute it live in your editor.",
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

    // Add assistant thinking message with tool badge
    setMessages(prev => [
      ...prev,
      {
        id: assistantMsgId,
        sender: "assistant",
        text: "Understanding prompt & orchestrating Unreal Engine scene...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall: {
          name: "execute_python_in_editor",
          script: "# Executing instruction inside Unreal Engine...",
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
                  text: `Successfully executed your request in Unreal Engine!`,
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
                  text: `❌ Could not complete request in Unreal Engine. Please check your connection.`,
                  toolCall: {
                    name: "execute_python_in_editor",
                    script: "# Attempted execution",
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
                text: `❌ Connection Error: Ensure UnrealMCP_Relay.exe and Ngrok are running.`,
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
    <div className="h-screen flex flex-col bg-[#09090b] text-foreground overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <header className="h-14 flex justify-between items-center px-6 border-b border-white/10 glass sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="font-bold text-base tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-extrabold text-white text-xs shadow-[0_0_12px_rgba(37,99,235,0.6)]">
              U
            </div>
            <span>Unreal MCP AI Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Antigravity Integration Button */}
          <button
            onClick={() => setShowAntigravityModal(true)}
            className="px-3 py-1.5 rounded-lg glass hover:bg-white/10 text-xs font-semibold text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Connect to Antigravity / Cursor</span>
          </button>

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-1.5 rounded-lg text-xs">
            <span className={`w-2 h-2 rounded-full ${ngrokUrl ? "bg-green-400 animate-pulse" : "bg-yellow-500"}`} />
            <span className="text-gray-300 font-mono text-[11px]">
              {ngrokUrl ? "Relay Connected" : "No Tunnel"}
            </span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? "bg-white/15 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Antigravity / Cursor Integration Modal */}
      {showAntigravityModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Cpu className="w-5 h-5 text-purple-400" /> Connect to Antigravity, Claude or Cursor
              </h3>
              <button 
                onClick={() => setShowAntigravityModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              To use Unreal MCP inside <strong>Antigravity</strong>, <strong>Claude Desktop</strong>, or <strong>Cursor IDE</strong>, simply add this configuration block to your tool settings:
            </p>

            <div className="bg-black/90 p-4 rounded-xl border border-white/10 font-mono text-xs text-purple-300 relative mb-4">
              <button
                onClick={copyAntigravityConfig}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-gray-300 transition-colors flex items-center gap-1 text-[11px]"
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
              <p>📍 <strong>Antigravity / Claude Desktop Path</strong>: <code>%APPDATA%/Claude/claude_desktop_config.json</code></p>
              <p>📍 <strong>Cursor IDE</strong>: Settings → Features → MCP → Add Server (Type: <code>command</code>)</p>
            </div>

            <button
              onClick={() => setShowAntigravityModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute inset-y-0 right-0 w-80 glass-panel border-l border-white/15 p-6 z-30 shadow-2xl flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold mb-1 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" /> Connection Settings
              </h3>
              <p className="text-xs text-gray-400">Configure your local tunnel endpoint.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-300">Ngrok / Local Tunnel SSE URL</label>
              <input
                type="text"
                placeholder="https://xxxx.ngrok.app/sse"
                value={ngrokUrl}
                onChange={e => setNgrokUrl(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-gray-500">The URL shown in your running <code>UnrealMCP_Relay.exe</code> window.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-300">Model Engine</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-gray-200"
              >
                <option value="antigravity-auto">✨ Antigravity Auto Engine (Recommended)</option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all"
            >
              Save Settings
            </button>
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-1 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-xl flex flex-col gap-2 ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  
                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                        : "glass-panel border border-white/10 text-gray-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Clean Tool Execution Badge */}
                  {msg.toolCall && (
                    <div className="w-full glass rounded-xl border border-white/10 overflow-hidden text-xs mt-1">
                      <div className="px-3.5 py-2.5 bg-black/40 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          {msg.toolCall.status === "running" && <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />}
                          {msg.toolCall.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                          {msg.toolCall.status === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                          <span className="text-gray-200 font-medium">⚡ Executing Unreal Engine Command</span>
                        </div>
                        <button
                          onClick={() => toggleToolExpand(msg.id)}
                          className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 font-mono"
                        >
                          {expandedTools[msg.id] ? "Hide Output" : "View Output"}
                          {expandedTools[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {expandedTools[msg.id] && msg.toolCall.output && (
                        <div className="p-3 bg-black/90 font-mono text-[11px] border-t border-white/10 text-green-400 overflow-x-auto whitespace-pre-wrap">
                          {msg.toolCall.output}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-gray-500 px-1">{msg.timestamp}</span>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-gray-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Prompt Bar */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="relative glass-panel rounded-2xl border border-white/20 focus-within:border-blue-500/60 transition-all p-2 flex items-center gap-3 shadow-2xl">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendPrompt()}
                placeholder="Ask Unreal MCP (e.g., 'Spawn a point light at 0,0,200' or 'Set directional light color to blue')..."
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={handleSendPrompt}
                disabled={isProcessing || !prompt.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)]"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send</span>
              </button>
            </div>
            <div className="flex justify-between items-center px-2 mt-2 text-[11px] text-gray-500 font-mono">
              <span>Model: ✨ Antigravity Auto Engine</span>
              <span>Zero-Code Prompt Mode</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
