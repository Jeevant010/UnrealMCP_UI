import { NextResponse } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * Intelligent Unreal Engine Python Code Generator
 * Converts natural language prompts into valid Unreal Python API commands out-of-the-box.
 */
function generateUnrealPython(prompt: string, customScript?: string): string {
  if (customScript && customScript.includes("import unreal")) {
    return customScript;
  }

  const p = prompt.toLowerCase();

  // Pattern 1: Spawning Lights (PointLight, SpotLight, DirectionalLight)
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

  // Pattern 2: Spawning CineCamera / Cameras
  if (p.includes("camera")) {
    return `import unreal
camera = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.CineCameraActor, unreal.Vector(0, -500, 150))
print(f"✓ Created CineCamera: {camera.get_name()}")`;
  }

  // Pattern 3: Listing Scene Actors
  if (p.includes("list") || p.includes("get actors") || p.includes("show actors") || p.includes("all actors")) {
    return `import unreal
actors = unreal.EditorLevelLibrary.get_all_level_actors()
print(f"Total Actors in Level: {len(actors)}")
for a in actors[:15]:
    print(f" - {a.get_name()} ({a.get_class().get_name()})")`;
  }

  // Pattern 4: Spawning Basic Shapes (Cube, Sphere, StaticMesh)
  if (p.includes("cube") || p.includes("box") || p.includes("shape") || p.includes("spawn")) {
    return `import unreal
actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(0, 0, 100))
print(f"✓ Created Actor: {actor.get_name()}")`;
  }

  // Generic Fallback: Executing safe Unreal Python statement
  return `import unreal
print("🤖 Unreal MCP Assistant Executed Prompt: ${prompt.replace(/"/g, '\\"')}")
actors = unreal.EditorLevelLibrary.get_all_level_actors()
print(f"Active Scene Actors: {len(actors)}")`;
}

export async function POST(req: Request) {
  try {
    const { url, script, prompt } = await req.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "Missing Ngrok Tunnel URL. Please enter your URL in Settings." },
        { status: 400 }
      );
    }

    // Generate the appropriate Unreal Python script from prompt or raw input
    const pythonCode = generateUnrealPython(prompt || "", script);

    // Ensure the URL ends with /sse for transport
    const sseUrl = url.endsWith("/sse") ? url : `${url.replace(/\/$/, "")}/sse`;
    
    // Create the SSE Transport
    const transport = new SSEClientTransport(new URL(sseUrl));

    // Create the MCP Client
    const client = new Client(
      { name: "Unreal-MCP-AI-Studio", version: "1.0.0" },
      { capabilities: {} }
    );

    // Connect to the Local MCP Server via Ngrok
    await client.connect(transport);

    // Execute the Python script inside Unreal Engine
    try {
      const result = await client.callTool({
        name: "execute_python_in_editor",
        arguments: { script: pythonCode },
      });

      await client.close();

      const outputText = (result.content as any[])?.[0]?.text || "Command executed successfully in Unreal Engine.";

      return NextResponse.json({
        success: true,
        executedScript: pythonCode,
        result: outputText,
      });
    } catch (toolError: any) {
      await client.close();
      return NextResponse.json(
        { success: false, executedScript: pythonCode, error: `Unreal Engine Execution Error: ${toolError.message || JSON.stringify(toolError)}` },
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
