const { WebSocketServer } = require("ws");

// ── theme (for reference in line styling) ─────────────────────────────────────
const T = {
  cyan: "#58a6ff", green: "#3fb950", amber: "#d29922",
  red: "#f85149", purple: "#bc8cff", teal: "#39d3c3", orange: "#f0883e",
};

// ── scene state ───────────────────────────────────────────────────────────────
let scene = {
  actors: [
    { id: "a1", name: "DirectionalLight_1", type: "DirectionalLight", x: 0, y: 0, z: 500, scale: 1, color: "#fffbe6", visible: true },
    { id: "a2", name: "SkyLight_1", type: "SkyLight", x: 0, y: 0, z: 0, scale: 1, color: "#b4d9ff", visible: true },
    { id: "a3", name: "PlayerStart_1", type: "PlayerStart", x: -200, y: 0, z: 100, scale: 1, color: "#78ff8c", visible: true },
  ],
  nextId: 4,
  levelName: "Untitled",
  playing: false,
};

// ── shape & material colors ───────────────────────────────────────────────────
const SHAPE_COLORS = {
  Cube: "#58a6ff", Sphere: "#bc8cff", Cylinder: "#39d3c3", Cone: "#f0883e", Plane: "#3fb950",
};
const MAT_COLORS = {
  M_Emissive_Blue: "#58a6ff", M_Metal_Gold: "#f0c040", M_Emissive_Red: "#f85149",
  M_Glass: "#a8d8ff", M_Concrete: "#888", M_Basic_Surface: "#c8c8c8",
};

// ── scene reducer ─────────────────────────────────────────────────────────────
function applyCommand(cmd) {
  switch (cmd.type) {
    case "SPAWN": {
      const count = cmd.count || 1;
      const circle = cmd.layout === "circle";
      const r = cmd.radius || 300;
      const shape = cmd.shape || "Cube";
      const newActors = Array.from({ length: count }, (_, i) => ({
        id: `a${scene.nextId + i}`,
        name: `${shape}Actor_${scene.nextId + i}`,
        type: "StaticMeshActor",
        shape,
        x: circle ? Math.round(Math.cos(i * 2 * Math.PI / count) * r) : i * 150,
        y: circle ? Math.round(Math.sin(i * 2 * Math.PI / count) * r) : 0,
        z: cmd.z || 0,
        scale: 1,
        color: cmd.color || "#58a6ff",
        visible: true,
        material: cmd.material || null,
      }));
      scene = { ...scene, actors: [...scene.actors, ...newActors], nextId: scene.nextId + count };
      break;
    }
    case "DELETE":
      scene = { ...scene, actors: scene.actors.filter(a => !cmd.ids.includes(a.id)) };
      break;
    case "MOVE":
      scene = { ...scene, actors: scene.actors.map(a => a.name === cmd.name ? { ...a, x: cmd.x ?? a.x, y: cmd.y ?? a.y, z: cmd.z ?? a.z } : a) };
      break;
    case "SCALE":
      scene = { ...scene, actors: scene.actors.map(a => a.name === cmd.name ? { ...a, scale: cmd.scale } : a) };
      break;
    case "MATERIAL":
      scene = { ...scene, actors: scene.actors.map(a => a.name === cmd.name || cmd.all ? { ...a, material: cmd.material, color: cmd.color || a.color } : a) };
      break;
    case "TOGGLE_VIS":
      scene = { ...scene, actors: scene.actors.map(a => a.id === cmd.id ? { ...a, visible: !a.visible } : a) };
      break;
    case "SELECT":
      scene = { ...scene, selected: cmd.id };
      break;
    case "PLAY":
      scene = { ...scene, playing: true };
      break;
    case "STOP":
      scene = { ...scene, playing: false };
      break;
    case "CLEAR_MESH":
      scene = { ...scene, actors: scene.actors.filter(a => a.type !== "StaticMeshActor") };
      break;
  }
}

// ── command classifier ────────────────────────────────────────────────────────
function classify(p) {
  const l = p.toLowerCase();
  if (/stop.*play|stop.*pie|end.*play/i.test(l)) return "stop";
  if (/spawn|place|add.*mesh|create.*actor/i.test(l)) return "spawn";
  if (/list|show.*actor|get.*actor|query|what.*actor/i.test(l)) return "list";
  if (/move|teleport|set.*loc|relocate/i.test(l)) return "move";
  if (/scale|resize/i.test(l)) return "scale";
  if (/delete|remove|destroy|clear/i.test(l)) return "delete";
  if (/blueprint|bp_/i.test(l)) return "blueprint";
  if (/material|texture|emissive|metal|glass|concret/i.test(l)) return "material";
  if (/color|colour/i.test(l)) return "color";
  if (/level|world|scene info|setting/i.test(l)) return "level";
  if (/play|start.*edit|pie/i.test(l)) return "play";
  if (/screenshot|capture/i.test(l)) return "screenshot";
  return "default";
}

// ── command parser ────────────────────────────────────────────────────────────
function parseCommand(type, prompt) {
  const match = (re) => (prompt.match(re) || [])[1];
  const nums = prompt.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];

  switch (type) {
    case "spawn": {
      const count = nums[0] && nums[0] < 20 ? Math.round(nums[0]) : 1;
      const shape = /sphere/i.test(prompt) ? "Sphere" : /cylinder/i.test(prompt) ? "Cylinder" : /cone/i.test(prompt) ? "Cone" : /plane/i.test(prompt) ? "Plane" : "Cube";
      const circle = /circle|ring/i.test(prompt);
      const radius = nums.find(n => n > 10) || 300;
      const z = nums.find(n => n >= 0 && n !== count && n !== radius) ?? 0;
      const colorName = /red/i.test(prompt) ? "#f85149" : /green/i.test(prompt) ? "#3fb950" : /blue/i.test(prompt) ? "#58a6ff" : /gold|yellow/i.test(prompt) ? "#f0c040" : /orange/i.test(prompt) ? "#f0883e" : SHAPE_COLORS[shape];
      return {
        cmd: { type: "SPAWN", count, shape, layout: circle ? "circle" : "linear", radius, z, color: colorName },
        lines: [
          { k: "info", v: `→ spawn_actor  ·  ${shape}  ·  count=${count}  ·  ${circle ? `circle r=${radius}` : `z=${z}`}` },
          { k: "json", v: JSON.stringify({ tool: "spawn_actor", params: { asset: `/Engine/BasicShapes/${shape}.${shape}`, count, layout: circle ? "circle" : "linear", color: colorName, z } }, null, 2) },
          { k: "success", v: `✓  spawned ${count} ${shape.toLowerCase()}(s) on game thread — scene updated →` },
        ],
      };
    }
    case "list": return {
      cmd: null,
      lines: [
        { k: "info", v: "→ list_actors  ·  scope: current_level" },
        { k: "json", v: JSON.stringify({ tool: "list_actors", params: { filter: "all" } }, null, 2) },
        { k: "success", v: `✓  found ${scene.actors.length} actors in "${scene.levelName}"` },
        { k: "json", v: JSON.stringify({ actors: scene.actors.map(a => ({ name: a.name, type: a.type, location: { x: a.x, y: a.y, z: a.z } })) }, null, 2) },
      ],
    };
    case "move": {
      const name = match(/move\s+([\w_]+)/i) || scene.actors.find(a => a.type === "StaticMeshActor")?.name || "CubeActor_4";
      const [x, y, z] = [nums[0] ?? 200, nums[1] ?? 100, nums[2] ?? 0];
      return {
        cmd: { type: "MOVE", name, x, y, z },
        lines: [
          { k: "info", v: `→ move_actor  ·  actor: ${name}  ·  target: (${x}, ${y}, ${z})` },
          { k: "json", v: JSON.stringify({ tool: "move_actor", params: { actor_name: name, location: { x, y, z } } }, null, 2) },
          { k: "success", v: `✓  ${name} moved → scene updated` },
        ],
      };
    }
    case "scale": {
      const name = match(/scale\s+([\w_]+)/i) || scene.actors.find(a => a.type === "StaticMeshActor")?.name || "CubeActor_4";
      const s = nums[0] || 2;
      return {
        cmd: { type: "SCALE", name, scale: s },
        lines: [
          { k: "info", v: `→ scale_actor  ·  actor: ${name}  ·  scale: ${s}x` },
          { k: "json", v: JSON.stringify({ tool: "scale_actor", params: { actor_name: name, scale: s } }, null, 2) },
          { k: "success", v: `✓  ${name} scaled to ${s}x → scene updated` },
        ],
      };
    }
    case "delete": {
      const all = /all/i.test(prompt);
      const ids = all ? scene.actors.filter(a => a.type === "StaticMeshActor").map(a => a.id) : scene.actors.filter(a => a.type === "StaticMeshActor").slice(0, 1).map(a => a.id);
      return {
        cmd: { type: "DELETE", ids },
        lines: [
          { k: "warn", v: `⚠  delete_actor  ·  targets: ${ids.length} actor(s)  ·  safety read done` },
          { k: "json", v: JSON.stringify({ tool: "delete_actor", params: { filter: all ? "StaticMeshActor" : "selected", count: ids.length } }, null, 2) },
          { k: "success", v: `✓  deleted ${ids.length} actor(s) → scene updated` },
        ],
      };
    }
    case "blueprint": {
      const name = match(/\b(BP_\w+)\b/) || match(/(?:named|called)\s+(\w+)/i) || "BP_NewClass";
      const parent = match(/inherit\w*\s+(?:from\s+)?(\w+)/i) || "Actor";
      return {
        cmd: null,
        lines: [
          { k: "info", v: `→ create_blueprint  ·  class: ${name}  ·  parent: ${parent}` },
          { k: "json", v: JSON.stringify({ tool: "create_blueprint", params: { class_name: name, parent_class: parent, path: "/Game/Blueprints/" } }, null, 2) },
          { k: "success", v: `✓  ${name} created at /Game/Blueprints/${name}` },
          { k: "plain", v: "FKismetEditorUtilities::CreateBlueprint() · asset registered in Content Browser" },
        ],
      };
    }
    case "material":
    case "color": {
      const matName = /gold|metal/i.test(prompt) ? "M_Metal_Gold" : /red/i.test(prompt) ? "M_Emissive_Red" : /glass/i.test(prompt) ? "M_Glass" : /concrete/i.test(prompt) ? "M_Concrete" : "M_Emissive_Blue";
      const col = MAT_COLORS[matName] || "#58a6ff";
      const all = /all/i.test(prompt);
      const target = match(/to\s+([\w_]+)/i) || scene.actors.find(a => a.type === "StaticMeshActor")?.name || "selected";
      return {
        cmd: { type: "MATERIAL", name: target, all, material: matName, color: col },
        lines: [
          { k: "info", v: `→ set_material  ·  mat: ${matName}  ·  target: ${all ? "all meshes" : target}` },
          { k: "json", v: JSON.stringify({ tool: "set_material", params: { actor: all ? "*" : target, material_path: `/Game/Materials/${matName}.${matName}` } }, null, 2) },
          { k: "success", v: `✓  material applied  ·  shader compiled → scene updated` },
        ],
      };
    }
    case "level": return {
      cmd: null,
      lines: [
        { k: "info", v: "→ get_level_info  ·  scope: world_settings" },
        { k: "json", v: JSON.stringify({ tool: "get_level_info", params: {} }, null, 2) },
        { k: "success", v: "✓  level info retrieved" },
        { k: "json", v: JSON.stringify({ level_name: scene.levelName, actor_count: scene.actors.length, game_mode: "BP_GameMode_C", gravity: -980, time_dilation: 1.0, playing: scene.playing }, null, 2) },
      ],
    };
    case "play": return {
      cmd: { type: "PLAY" },
      lines: [
        { k: "info", v: "→ play_level  ·  mode: PIE" },
        { k: "json", v: JSON.stringify({ tool: "play_level", params: { mode: "PIE" } }, null, 2) },
        { k: "success", v: "✓  play-in-editor started  ·  game thread running" },
      ],
    };
    case "stop": return {
      cmd: { type: "STOP" },
      lines: [
        { k: "info", v: "→ stop_level  ·  end PIE" },
        { k: "success", v: "✓  PIE session ended" },
      ],
    };
    case "screenshot": return {
      cmd: null,
      lines: [
        { k: "info", v: "→ take_screenshot  ·  viewport: active" },
        { k: "success", v: "✓  saved to /Saved/Screenshots/Screenshot_001.png" },
      ],
    };
    default: return {
      cmd: null,
      lines: [
        { k: "warn", v: `⚠  could not parse: "${prompt.slice(0, 40)}"` },
        { k: "plain", v: 'try: "spawn 5 cubes in a circle", "move CubeActor_4 to (200,100,0)", "apply gold material"' },
      ],
    };
  }
}

// ── WebSocket Server ──────────────────────────────────────────────────────────
const PORT = 8000;
const wss = new WebSocketServer({ port: PORT });

console.log(`[Unreal-MCP WS Server] running on ws://localhost:${PORT}`);

function broadcastScene() {
  const msg = JSON.stringify({ type: "scene_sync", scene });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

wss.on("connection", (ws) => {
  console.log("[WS] client connected");

  // send initial scene state
  ws.send(JSON.stringify({ type: "scene_sync", scene }));

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (data.type === "command") {
      const prompt = data.prompt || "";
      const cmdType = classify(prompt);
      const { cmd, lines } = parseCommand(cmdType, prompt);

      // Apply scene mutation
      if (cmd) applyCommand(cmd);

      // Send response lines back to the sender
      ws.send(JSON.stringify({
        type: "response",
        lines,
        scene,
      }));

      // Broadcast updated scene to all clients
      broadcastScene();
    }

    if (data.type === "scene_action") {
      // Direct scene actions (toggle visibility, select, etc.)
      applyCommand(data.cmd);
      broadcastScene();
    }
  });

  ws.on("close", () => {
    console.log("[WS] client disconnected");
  });
});
