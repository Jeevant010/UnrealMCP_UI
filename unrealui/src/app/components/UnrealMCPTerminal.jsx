"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useWebSocket from "../hooks/useWebSocket";

// ── theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg0:     "#000000ff",
  bg1:     "#0d1117",
  bg2:     "#161b22",
  bg3:     "#1c2128",
  border:  "#21262d",
  borderB: "#30363d",
  cyan:    "#58a6ff",
  green:   "#3fb950",
  amber:   "#d29922",
  red:     "#f85149",
  purple:  "#bc8cff",
  teal:    "#39d3c3",
  orange:  "#f0883e",
  txt:     "#e6edf3",
  muted:   "#8b949e",
  dim:     "#484f58",
};

// ── terminal line ─────────────────────────────────────────────────────────────
const LINE_STYLES = {
  info:    { color: "#79c0ff", background: "rgba(56,139,253,.07)", borderLeft: `2px solid ${T.cyan}` },
  success: { color: "#56d364", background: "rgba(63,185,80,.07)",  borderLeft: `2px solid ${T.green}` },
  warn:    { color: "#e3b341", background: "rgba(210,153,34,.08)", borderLeft: `2px solid ${T.amber}` },
  error:   { color: "#f85149", background: "rgba(248,81,73,.07)",  borderLeft: `2px solid ${T.red}` },
  plain:   { color: T.muted },
  system:  { color: T.dim, fontSize: 10 },
};

function TermLine({ line }) {
  if (line.k === "prompt") return (
    <div style={{ display: "flex", gap: 8, marginBottom: 3, fontFamily: "monospace", fontSize: 12, alignItems: "flex-start" }}>
      <span style={{ color: T.cyan, whiteSpace: "nowrap", flexShrink: 0 }}>$</span>
      <span style={{ color: T.txt }}>{line.v}</span>
    </div>
  );
  if (line.k === "divider") return (
    <div style={{ borderTop: `1px solid ${T.border}`, margin: "6px 0", opacity: .5 }} />
  );
  const s = LINE_STYLES[line.k] || {};
  return (
    <div style={{ padding: "5px 9px", borderRadius: 4, marginBottom: 2, lineHeight: 1.65, fontSize: 12, fontFamily: "monospace", ...s }}>
      {line.v}
    </div>
  );
}

// ── stat badge ────────────────────────────────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 6, padding: "6px 10px", border: `1px solid ${T.border}`, minWidth: 60, textAlign: "center" }}>
      <div style={{ fontSize: 9, color: T.dim, fontFamily: "monospace", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: color || T.txt, fontFamily: "monospace", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// ── connection status colors ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  connected:    { color: T.green,  label: "connected",    dot: "●", anim: "pulse 2s infinite" },
  connecting:   { color: T.amber,  label: "connecting",   dot: "◐", anim: "pulse 1s infinite" },
  reconnecting: { color: T.amber,  label: "reconnecting", dot: "◐", anim: "pulse 0.8s infinite" },
  disconnected: { color: T.red,    label: "disconnected", dot: "○", anim: "none" },
};

// ── main app ──────────────────────────────────────────────────────────────────
export default function UnrealMCPTerminal() {
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket("ws://localhost:8080/ws/chat");

  const [lines, setLines] = useState([
    { k: "system", v: "Unreal-MCP Terminal  ·  UE5 Remote Control  ·  WebSocket → api_server.py" },
    { k: "system", v: "Connecting to ws://localhost:8080/ws/chat ..." },
    { k: "divider", v: "" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [backend, setBackend] = useState("groq");
  const [mode, setMode] = useState("build");
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0, total: 0 });
  const termRef = useRef(null);
  const textRef = useRef(null);

  // scroll terminal on new lines
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines, thinking]);

  // handle incoming WebSocket messages from api_server.py
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "status") {
      // Real-time status updates from the build pipeline
      setLines(prev => [
        ...prev,
        { k: "info", v: lastMessage.message },
      ]);
    }

    if (lastMessage.type === "success") {
      setThinking(false);
      setBusy(false);
      setLines(prev => [
        ...prev,
        { k: "success", v: `✓  ${lastMessage.message}` },
        { k: "divider", v: "" },
      ]);
      textRef.current?.focus();
    }

    if (lastMessage.type === "error") {
      setThinking(false);
      setBusy(false);
      setLines(prev => [
        ...prev,
        { k: "error", v: `⚠  ${lastMessage.message}` },
        { k: "divider", v: "" },
      ]);
      textRef.current?.focus();
    }

    if (lastMessage.type === "telemetry") {
      setTokenUsage(prev => ({
        input: prev.input + (lastMessage.usage?.input_tokens || 0),
        output: prev.output + (lastMessage.usage?.output_tokens || 0),
        total: prev.total + (lastMessage.usage?.total_tokens || 0),
      }));
      setLines(prev => [
        ...prev,
        { k: "plain", v: `tokens: in=${lastMessage.usage?.input_tokens || 0}  out=${lastMessage.usage?.output_tokens || 0}  total=${lastMessage.usage?.total_tokens || 0}` },
      ]);
    }
  }, [lastMessage]);

  // log connection status changes
  useEffect(() => {
    if (connectionStatus === "connected") {
      setLines(prev => [...prev, { k: "success", v: "✓  WebSocket connected to api_server.py" }, { k: "divider", v: "" }]);
    } else if (connectionStatus === "reconnecting") {
      setLines(prev => [...prev, { k: "warn", v: "⚠  WebSocket disconnected — attempting to reconnect..." }]);
    }
  }, [connectionStatus]);

  // send command to api_server.py via WebSocket
  const run = useCallback((prompt) => {
    const p = (prompt || input).trim();
    if (!p || busy) return;

    if (connectionStatus !== "connected") {
      setLines(prev => [...prev, { k: "error", v: "⚠  Not connected to WebSocket server" }, { k: "divider", v: "" }]);
      return;
    }

    setBusy(true);
    setInput("");
    setLines(prev => [...prev, { k: "prompt", v: p }]);
    setThinking(true);

    // Send JSON payload matching api_server.py protocol
    sendMessage({
      prompt: p,
      config: { backend, mode },
    });
  }, [input, busy, connectionStatus, sendMessage, backend, mode]);

  const statusCfg = STATUS_CONFIG[connectionStatus] || STATUS_CONFIG.disconnected;

  // Mode labels for display
  const MODE_LABELS = { build: "Live Builder", two_phase: "C++ CodeGen", classic: "Classic Agent" };
  const BACKEND_LABELS = { groq: "Groq", ollama: "Ollama", gemini: "Gemini" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "93vh", background: T.bg1, color: T.txt, fontFamily: "monospace", overflow: "hidden" }}>
      <style>{`
        @keyframes blink{0%,80%,100%{opacity:0}40%{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${T.borderB};border-radius:2px}
        .trow:hover{background:rgba(255,255,255,.04)!important}
        textarea::placeholder{color:${T.dim}}
        textarea{caret-color:${T.cyan}}
        select{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23484f58'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;padding-right:22px}
        select:focus{outline:1px solid ${T.cyan}}
      `}</style>

      {/* ── top bar ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg2, gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0d1a30", border: `1px solid ${T.borderB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="15" height="15" viewBox="0 0 15 15"><rect x="1" y="1" width="5.5" height="5.5" rx="1" fill={T.cyan}/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" fill={T.purple}/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" fill={T.purple}/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill={T.green}/></svg>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Unreal-MCP Terminal</div>
          <div style={{ fontSize: 9, color: T.dim }}>AI · MCP · UE5 Remote Control · WebSocket</div>
        </div>
        <div style={{ flex: 1 }} />

        {/* ── backend selector ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 8, color: T.dim, letterSpacing: ".1em", textTransform: "uppercase" }}>backend</span>
          <select
            value={backend}
            onChange={(e) => setBackend(e.target.value)}
            style={{ background: T.bg0, color: T.txt, border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 8px", fontSize: 11, fontFamily: "monospace", cursor: "pointer" }}
          >
            <option value="groq">Groq (Llama 3)</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>

        {/* ── mode selector ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 8, color: T.dim, letterSpacing: ".1em", textTransform: "uppercase" }}>mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ background: T.bg0, color: T.txt, border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 8px", fontSize: 11, fontFamily: "monospace", cursor: "pointer" }}
          >
            <option value="build">Live Builder</option>
            <option value="two_phase">C++ CodeGen</option>
            <option value="classic">Classic Agent</option>
          </select>
        </div>

        {/* ── token stats ── */}
        {tokenUsage.total > 0 && (
          <>
            <Stat label="in tokens" value={tokenUsage.input.toLocaleString()} color={T.cyan} />
            <Stat label="out tokens" value={tokenUsage.output.toLocaleString()} color={T.purple} />
            <Stat label="total" value={tokenUsage.total.toLocaleString()} color={T.green} />
          </>
        )}

        {/* ── active config badge ── */}
        <Stat label="backend" value={BACKEND_LABELS[backend] || backend} color={T.amber} />
        <Stat label="mode" value={MODE_LABELS[mode] || mode} color={T.teal} />

        {/* WebSocket connection badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: T.bg3, borderRadius: 6, border: `1px solid ${T.border}` }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: statusCfg.color,
            display: "inline-block",
            animation: statusCfg.anim,
          }} />
          <span style={{ fontSize: 10, color: statusCfg.color }}>{statusCfg.label}</span>
        </div>
      </div>

      {/* ── body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── terminal ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* terminal output */}
          <div ref={termRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", background: T.bg0 }}>
            {lines.map((line, i) => <TermLine key={i} line={line} />)}
            {thinking && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.dim, fontSize: 11, padding: "4px 0" }}>
                <span style={{ color: "#388bfd" }}>MCP</span>
                <span>routing via WebSocket</span>
                {[0, 180, 360].map(d => <span key={d} style={{ animation: `blink 1.1s ${d}ms infinite`, display: "inline-block" }}>.</span>)}
              </div>
            )}
          </div>

          {/* input row */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 12px", background: T.bg2, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
              <div style={{ flex: 1, border: `1px solid ${busy ? T.border : T.borderB}`, borderRadius: 7, background: T.bg0, display: "flex", alignItems: "center", padding: "0 10px", transition: "border-color .2s" }}>
                <span style={{ color: T.cyan, fontSize: 11, marginRight: 7, opacity: .6 }}>$</span>
                <textarea
                  ref={textRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); } }}
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px"; }}
                  disabled={busy}
                  rows={1}
                  placeholder={connectionStatus === "connected" ? "describe what you want Unreal to do..." : "waiting for WebSocket connection..."}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontFamily: "monospace", fontSize: 12, color: T.txt, padding: "9px 0", lineHeight: 1.5, maxHeight: 90 }}
                />
              </div>
              <button
                onClick={() => run()}
                disabled={busy || !input.trim() || connectionStatus !== "connected"}
                style={{ padding: "9px 16px", background: busy ? "transparent" : "rgba(63,185,80,.1)", border: `1px solid ${busy || !input.trim() || connectionStatus !== "connected" ? T.border : T.green}`, borderRadius: 7, cursor: busy || !input.trim() || connectionStatus !== "connected" ? "not-allowed" : "pointer", color: busy ? T.dim : connectionStatus !== "connected" ? T.dim : T.green, fontSize: 11, fontFamily: "monospace", height: 40, whiteSpace: "nowrap", transition: "all .2s" }}
              >{busy ? "running…" : "run ↵"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
