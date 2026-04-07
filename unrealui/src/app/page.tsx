"use client";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [backend, setBackend] = useState("groq");
  const [mode, setMode] = useState("build");
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0, total: 0 });
  const ws = useRef<WebSocket | null>(null);

  // Connect to the Python Server when the page loads
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080/ws/chat");
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "telemetry") {
        setTokenUsage((prev) => ({
          input: prev.input + (data.usage?.input_tokens || 0),
          output: prev.output + (data.usage?.output_tokens || 0),
          total: prev.total + (data.usage?.total_tokens || 0)
        }));
      } else {
        setMessages((prev) => [...prev, `[${data.type.toUpperCase()}] ${data.message}`]);
      }
    };

    return () => ws.current?.close();
  }, []);

  const handleSend = () => {
    if (!ws.current || prompt.trim() === "") return;
    
    // Add user message to UI
    setMessages((prev) => [...prev, `[USER] ${prompt}`]);
    
    // Send configuration and prompt to Python agent
    const payload = {
      prompt,
      config: { backend, mode }
    };
    ws.current.send(JSON.stringify(payload));
    setPrompt("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 font-sans transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Unreal Engine Builder
        </h1>
        
        {/* Controls */}
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col flex-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Backend</label>
            <select
              value={backend}
              onChange={(e) => setBackend(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors cursor-pointer"
            >
              <option value="groq">Groq (Llama 3)</option>
              <option value="ollama">Ollama (Local Models)</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-colors cursor-pointer"
            >
              <option value="build">Live Builder (Scene Generation)</option>
              <option value="two_phase">C++ Code Generator</option>
              <option value="classic">Classic Tool-Calling Agent</option>
            </select>
          </div>
        </div>

        {/* Token Tracker */}
        {(tokenUsage.total > 0) && (
          <div className="flex flex-wrap gap-4 md:gap-8 mb-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 shadow-sm text-sm justify-center items-center font-mono">
            <div><span className="font-bold opacity-60 uppercase tracking-wider text-xs mr-2">Input:</span> {tokenUsage.input.toLocaleString()}</div>
            <div><span className="font-bold opacity-60 uppercase tracking-wider text-xs mr-2">Output:</span> {tokenUsage.output.toLocaleString()}</div>
            <div className="font-semibold text-blue-600 dark:text-blue-400"><span className="font-bold opacity-60 uppercase tracking-wider text-xs mr-2 text-inherit">Session Total:</span> {tokenUsage.total.toLocaleString()}</div>
          </div>
        )}

        {/* Chat Window */}
        <div className="h-[55vh] border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 overflow-y-auto bg-white dark:bg-gray-900 shadow-sm flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center m-auto italic">
              Connect to UE and type a prompt below...
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg text-sm font-mono max-w-[85%] shadow-sm ${
                  msg.startsWith("[USER]") 
                    ? "bg-blue-600 text-white self-end" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 self-start"
                }`}
              >
                {msg.replace("[USER]", "").trim()}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="e.g., Build a small hut with a door..."
            className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={!prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
