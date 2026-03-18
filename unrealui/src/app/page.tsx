"use client";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  // Connect to the Python Server when the page loads
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080/ws/chat");
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, `[${data.type.toUpperCase()}] ${data.message}`]);
    };

    return () => ws.current?.close();
  }, []);

  const handleSend = () => {
    if (!ws.current || prompt.trim() === "") return;
    
    // Add user message to UI
    setMessages((prev) => [...prev, `[USER] ${prompt}`]);
    
    // Send to Python agent
    ws.current.send(prompt);
    setPrompt("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 font-sans transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Unreal Engine Builder
        </h1>
        
        {/* Chat Window */}
        <div className="h-[60vh] border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 overflow-y-auto bg-white dark:bg-gray-900 shadow-sm flex flex-col gap-3">
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
