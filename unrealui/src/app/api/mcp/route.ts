import { NextResponse } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * Call OpenAI / Groq / OpenRouter API to generate Unreal Engine Python code dynamically.
 */
async function callLLMForPython(prompt: string, apiKey?: string, model?: string): Promise<{ explanation: string; pythonCode: string }> {
  const keyToUse = apiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  
  if (!keyToUse) {
    // Fallback to pattern matcher if no key is supplied
    return {
      explanation: "Generated script using built-in Unreal MCP Engine.",
      pythonCode: generateFallbackPython(prompt)
    };
  }

  const modelName = model === "gpt-4o-mini" ? "gpt-4o-mini" : (model === "claude-3-5-sonnet" ? "gpt-4o" : "gpt-4o");
  const isGroq = keyToUse.startsWith("gsk_");
  const endpoint = isGroq 
    ? "https://api.groq.com/openai/v1/chat/completions" 
    : "https://api.openai.com/v1/chat/completions";

  const systemPrompt = `You are an expert Unreal Engine 5 Python Technical Artist. 
Given a user prompt, generate VALID, EXECUTABLE Python code that imports 'unreal' and performs the requested actions using Unreal Engine Editor Python API.
Always wrap your Python code inside \`\`\`python ... \`\`\` blocks.
Use unreal.EditorLevelLibrary or unreal.CineCameraActor or unreal.PointLight or unreal.StaticMeshActor where appropriate. Print useful output using print().`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${keyToUse}`
      },
      body: JSON.stringify({
        model: isGroq ? "llama-3.3-70b-versatile" : modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("LLM API returned error, falling back to local engine:", errText);
      return {
        explanation: "Notice: API key rejected or rate-limited. Used built-in Unreal engine fallback.",
        pythonCode: generateFallbackPython(prompt)
      };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract Python code block
    const match = content.match(/```python([\s\S]*?)```/) || content.match(/```([\s\S]*?)```/);
    const pythonCode = match ? match[1].trim() : content.trim();

    // Remove code block to get explanation
    const explanation = content.replace(/```python[\s\S]*?```/g, "").replace(/```[\s\S]*?```/g, "").trim() || "Executed generated Python script.";

    return { explanation, pythonCode };
  } catch (e: any) {
    console.error("LLM Call Failed:", e);
    return {
      explanation: "Notice: LLM call failed. Used built-in engine fallback.",
      pythonCode: generateFallbackPython(prompt)
    };
  }
}

/**
 * Fallback pattern generator when no API key is provided
 */
function generateFallbackPython(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("light")) {
    if (p.includes("spot")) {
      return `import unreal
actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.SpotLight, unreal.Vector(0, 0, 200))
print(f"✓ Created SpotLight: {actor.get_name()}")`;
    }
    if (p.includes("directional") || p.includes("sun")) {
      return `import unreal
actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.DirectionalLight, unreal.Vector(0, 0, 500))
print(f"✓ Created DirectionalLight: {actor.get_name()}")`;
    }
    return `import unreal
actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PointLight, unreal.Vector(0, 0, 200))
print(f"✓ Created PointLight: {actor.get_name()}")`;
  }

  if (p.includes("camera")) {
    return `import unreal
camera = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.CineCameraActor, unreal.Vector(0, -500, 150))
print(f"✓ Created CineCamera: {camera.get_name()}")`;
  }

  if (p.includes("list") || p.includes("actors") || p.includes("all")) {
    return `import unreal
actors = unreal.EditorLevelLibrary.get_all_level_actors()
print(f"Total Actors in Level: {len(actors)}")
for a in actors[:15]:
    print(f" - {a.get_name()} ({a.get_class().get_name()})")`;
  }

  return `import unreal
actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(0, 0, 100))
print(f"✓ Spawned Actor for prompt: {prompt.replace(/"/g, '\\"')}")`;
}

export async function POST(req: Request) {
  try {
    const { url, script, prompt, apiKey, model } = await req.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "Missing Ngrok Tunnel URL. Please enter your URL in Settings." },
        { status: 400 }
      );
    }

    // Call LLM or generate code
    let pythonCode = script;
    let explanation = "Executing direct script.";

    if (prompt && (!script || !script.includes("import unreal"))) {
      const llmResult = await callLLMForPython(prompt, apiKey, model);
      pythonCode = llmResult.pythonCode;
      explanation = llmResult.explanation;
    }

    // Ensure URL ends with /sse
    const sseUrl = url.endsWith("/sse") ? url : `${url.replace(/\/$/, "")}/sse`;
    
    // Connect MCP Client over SSE
    const transport = new SSEClientTransport(new URL(sseUrl));
    const client = new Client(
      { name: "Unreal-MCP-AI-Studio", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);

    // Call tool on Unreal MCP Server
    try {
      const result = await client.callTool({
        name: "execute_python_in_editor",
        arguments: { script: pythonCode },
      });

      await client.close();

      const outputText = (result.content as any[])?.[0]?.text || "Command executed successfully in Unreal Engine.";

      return NextResponse.json({
        success: true,
        explanation,
        executedScript: pythonCode,
        result: outputText,
      });
    } catch (toolError: any) {
      await client.close();
      return NextResponse.json(
        { 
          success: false, 
          explanation,
          executedScript: pythonCode, 
          error: `Unreal Engine Execution Error: ${toolError.message || JSON.stringify(toolError)}` 
        },
        { status: 500 }
      );
    }

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Relay Connection Error: Could not reach ${err.message || "local server"}. Ensure UnrealMCP_Relay.exe and Ngrok are running.` },
      { status: 500 }
    );
  }
}
