# UnrealMCP_UI

# Deep-Dive Architecture & Libraries Guide for Unreal-MCP

This document explains **behind-the-scenes** how your entire Unreal-MCP system works, every library used, how data flows from a user click or prompt down to Unreal Engine, and how the individual protocols connect.

---

## 1. High-Level System Architecture

The system consists of three distinct layers communicating over standard networking protocols:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend Web IDE (Next.js 16 + React 19)                 │
│    - User Interface (Dark Mode Glassmorphism)               │
│    - Handles AI Prompt Input & Tool Result Visualization     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP SSE (Server-Sent Events) via Ngrok Tunnel
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Local MCP Server (Python + FastMCP + Uvicorn)            │
│    - Runs on User's PC as UnrealMCP_Relay.exe               │
│    - Exposes MCP Tools via SSE (port 8000) & STDIO          │
│    - Translates MCP tool calls into Unreal WebSocket JSON   │
└──────────────────────────────┬──────────────────────────────┘
                               │ WebSocket (ws://127.0.0.1:30020)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Unreal Engine 5 Editor                                   │
│    - Web Remote Control Plugin (Listening on port 30020)   │
│    - Embedded Python Interpreter (import unreal)            │
│    - Executes level editing, spawning, materials, lighting  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Libraries & Technologies Used

### A. Python MCP Backend (`Unreal-MCP`)

| Library / Tool | Role in Project | How It Works Under the Hood |
| :--- | :--- | :--- |
| **`fastmcp`** | MCP Protocol Framework | Wraps Python functions with `@mcp.tool()` decorators. Automatically generates JSON schemas for tool definitions and routes incoming MCP requests. |
| **`websockets`** | Unreal Engine Bridge | Establishes an persistent WebSocket connection to Unreal Engine's Web Remote Control plugin (`ws://127.0.0.1:30020`). |
| **`uvicorn`** | ASGI HTTP & SSE Server | High-performance Python server powering the Server-Sent Events (SSE) endpoint (`http://localhost:8000/sse`). |
| **`langchain` / `langchain_core`** | Agent Orchestration | Used in `agent.py` to chain together LLM prompts, memory, and MCP tool definitions. |
| **`langchain_groq` / `langchain_google_genai`** | Cloud LLM Providers | Connects to Groq (Llama 3.3 70B) or Google Gemini for high-speed cloud inference. |
| **`python-dotenv`** | Environment Config | Loads `.env` configuration (e.g. `UE_WS_URL`, `SERVER_PORT`). |

### B. Web UI & Relay Frontend (`UnrealMCP_UI/unrealui`)

| Library / Tool | Role in Project | How It Works Under the Hood |
| :--- | :--- | :--- |
| **`Next.js 16` (App Router)** | Framework | Handles serverless API routes (`/api/mcp`) and client-side page rendering (`/ide`, `/features`, `/download`). |
| **`@modelcontextprotocol/sdk`** | MCP TypeScript Client | Official Anthropic/MCP SDK. Implements `SSEClientTransport` to connect Next.js backend to the Ngrok SSE tunnel. |
| **`Tailwind CSS v4`** | Styling & Aesthetics | Utility-first CSS powering dark mode glassmorphism effects (`backdrop-filter`, HSL color palettes). |
| **`lucide-react`** | Icons | Provides iconography for IDE tools, status indicators, and terminal displays. |

---

## 3. Step-by-Step Data Flow Example: "Spawn a Light"

1. **User Prompt**: The user types *"Spawn a point light at location 0,0,200"* in the Web IDE.
2. **Next.js Backend**: The Next.js API route (`/api/mcp`) receives the prompt, initializes `SSEClientTransport`, and connects to the user's Ngrok URL (e.g., `https://xxxx.ngrok.app/sse`).
3. **MCP Handshake**: FastMCP on the local Python server receives the SSE connection, negotiates capabilities, and exposes available tools (`execute_python_in_editor`, `spawn_actor`, etc.).
4. **Tool Execution Request**: The AI selects `execute_python_in_editor` with arguments:
   ```python
   import unreal
   light = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PointLight, unreal.Vector(0, 0, 200))
   print(f"Spawned light: {light.get_name()}")
   ```
5. **WebSocket Payload to Unreal Engine**: The Python MCP server formats this request into an Unreal Remote Control WebSocket payload:
   ```json
   {
     "objectPath": "/Script/PythonScriptPlugin.Default__PythonScriptPluginUserSettings",
     "functionName": "ExecutePythonCommand",
     "parameters": { "PythonCommand": "..." }
   }
   ```
6. **Unreal Execution**: Unreal Engine executes the Python code in its embedded interpreter and sends `stdout` back over the WebSocket.
7. **Response Stream**: The result flows back: `Unreal WS -> Python MCP Server -> Ngrok Tunnel -> Next.js API -> Web UI Console`.

---

## 4. Why This Architecture is Modular & Scalable

- **Zero Heavy Cloud Backend**: Since Unreal Engine runs locally, your cloud web server (Vercel) only handles lightweight web pages and SSE client requests. You incur $0 server costs.
- **Universal IDE Compatibility**: Because `fastmcp` supports both `--sse` and `--stdio`, the exact same Python binary works in your Web IDE, Claude Desktop, Cursor, and VS Code.
    