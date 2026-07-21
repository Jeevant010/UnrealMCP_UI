import { NextResponse } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export async function POST(req: Request) {
  try {
    const { url, script } = await req.json();

    if (!url || !script) {
      return NextResponse.json(
        { success: false, error: "Missing Ngrok URL or Script." },
        { status: 400 }
      );
    }

    // Ensure the URL ends with /sse for the transport
    const sseUrl = url.endsWith("/sse") ? url : `${url.replace(/\/$/, "")}/sse`;
    
    // Create the SSE Transport
    const transport = new SSEClientTransport(new URL(sseUrl));

    // Create the MCP Client
    const client = new Client(
      { name: "Unreal-MCP-Web-IDE", version: "1.0.0" },
      { capabilities: {} }
    );

    // Connect to the Local MCP Server via Ngrok
    await client.connect(transport);

    // Call the tool to execute the python script
    try {
      const result = await client.callTool({
        name: "execute_python_in_editor",
        arguments: { script },
      });

      // Disconnect cleanly
      await client.close();

      return NextResponse.json({
        success: true,
        // The SDK returns text content inside the result.content array
        result: result.content?.[0]?.text || "Success (No output)",
      });
    } catch (toolError: any) {
      await client.close();
      return NextResponse.json(
        { success: false, error: `Tool Execution Error: ${toolError.message || JSON.stringify(toolError)}` },
        { status: 500 }
      );
    }

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Connection Error: ${err.message || JSON.stringify(err)}` },
      { status: 500 }
    );
  }
}
