"use client";

import { useState, useRef, useEffect, useCallback, useReducer } from "react";

// ── theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg0:     "#080c14",
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

// ── scene state (simulated UE5 world) ────────────────────────────────────────
const initScene = {
  actors: [
    { id: "a1", name: "DirectionalLight_1", type: "DirectionalLight", x: 0,    y: 0,   z: 500, scale: 1, color: "#fffbe6", visible: true },
    { id: "a2", name: "SkyLight_1",          type: "SkyLight",        x: 0,    y: 0,   z: 0,   scale: 1, color: "#b4d9ff", visible: true },
    { id: "a3", name: "PlayerStart_1",       type: "PlayerStart",     x: -200, y: 0,   z: 100, scale: 1, color: "#78ff8c", visible: true },
  ],
  nextId: 4,
  levelName: "Untitled",
  playing: false,
};

function sceneReducer(state, action) {
  switch (action.type) {
    case "SPAWN": {
      const count = action.count || 1;
      const circle = action.layout === "circle";
      const r = action.radius || 300;
      const shape = action.shape || "Cube";
      const newActors = Array.from({ length: count }, (_, i) => ({
        id: `a${state.nextId + i}`,
        name: `${shape}Actor_${state.nextId + i}`,
        type: "StaticMeshActor",
        shape,
        x: circle ? Math.round(Math.cos(i * 2 * Math.PI / count) * r) : i * 150,
        y: circle ? Math.round(Math.sin(i * 2 * Math.PI / count) * r) : 0,
        z: action.z || 0,
        scale: 1,
        color: action.color || "#58a6ff",
        visible: true,
        material: action.material || null,
      }));
      return { ...state, actors: [...state.actors, ...newActors], nextId: state.nextId + count };
    }
    case "DELETE":
      return { ...state, actors: state.actors.filter(a => !action.ids.includes(a.id)) };
    case "MOVE":
      return { ...state, actors: state.actors.map(a => a.name === action.name ? { ...a, x: action.x ?? a.x, y: action.y ?? a.y, z: action.z ?? a.z } : a) };
    case "SCALE":
      return { ...state, actors: state.actors.map(a => a.name === action.name ? { ...a, scale: action.scale } : a) };
    case "MATERIAL":
      return { ...state, actors: state.actors.map(a => a.name === action.name || action.all ? { ...a, material: action.material, color: action.color || a.color } : a) };
    case "TOGGLE_VIS":
      return { ...state, actors: state.actors.map(a => a.id === action.id ? { ...a, visible: !a.visible } : a) };
    case "SELECT":
      return { ...state, selected: action.id };
    case "PLAY":
      return { ...state, playing: true };
    case "STOP":
      return { ...state, playing: false };
    case "CLEAR_MESH":
      return { ...state, actors: state.actors.filter(a => a.type !== "StaticMeshActor") };
    default:
      return state;
  }
}

// ── tool catalogue ────────────────────────────────────────────────────────────
const TOOLS = [
  { group: "Actor", color: T.cyan, items: [
    { name: "spawn_actor",  desc: "Spawn mesh",         tpl: "spawn a red cube at position (0,0,100)" },
    { name: "move_actor",   desc: "Relocate",           tpl: "move CubeActor_4 to (300, 200, 50)" },
    { name: "scale_actor",  desc: "Resize",             tpl: "scale CubeActor_4 to 2x" },
    { name: "delete_actor", desc: "Remove",             tpl: "delete all cubes in the scene", color: T.red },
    { name: "list_actors",  desc: "Query all",          tpl: "list all actors in the level", color: T.green },
  ]},
  { group: "Blueprint", color: T.amber, items: [
    { name: "create_blueprint", desc: "New class",      tpl: "create a blueprint class BP_Enemy inheriting from Character" },
    { name: "add_component",    desc: "Add component",  tpl: "add a sphere collision component to BP_Enemy" },
  ]},
  { group: "Material", color: T.teal, items: [
    { name: "set_material", desc: "Apply shader",       tpl: "apply glowing blue emissive material to CubeActor_4" },
    { name: "set_color",    desc: "Base color",         tpl: "set color of all cubes to bright orange" },
  ]},
  { group: "Editor", color: T.purple, items: [
    { name: "get_level_info",  desc: "World metadata",  tpl: "show current level name and world settings", color: T.green },
    { name: "play_level",      desc: "Start PIE",       tpl: "start play in editor", color: T.green },
    { name: "stop_level",      desc: "Stop PIE",        tpl: "stop play in editor", color: T.red },
    { name: "clear_scene",     desc: "Reset meshes",    tpl: "clear all static mesh actors", color: T.red },
  ]},
];

// ── shape picker colors ───────────────────────────────────────────────────────
const SHAPE_COLORS = {
  Cube:     "#58a6ff",
  Sphere:   "#bc8cff",
  Cylinder: "#39d3c3",
  Cone:     "#f0883e",
  Plane:    "#3fb950",
};

const MAT_COLORS = {
  M_Emissive_Blue:  "#58a6ff",
  M_Metal_Gold:     "#f0c040",
  M_Emissive_Red:   "#f85149",
  M_Glass:          "#a8d8ff",
  M_Concrete:       "#888",
  M_Basic_Surface:  "#c8c8c8",
};

// ── command parser ────────────────────────────────────────────────────────────
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

function parseCommand(type, prompt, scene) {
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
      return { cmd: { type: "SPAWN", count, shape, layout: circle ? "circle" : "linear", radius, z, color: colorName }, lines: [
        { k: "info",    v: `→ spawn_actor  ·  ${shape}  ·  count=${count}  ·  ${circle ? `circle r=${radius}` : `z=${z}`}` },
        { k: "json",    v: JSON.stringify({ tool: "spawn_actor", params: { asset: `/Engine/BasicShapes/${shape}.${shape}`, count, layout: circle ? "circle" : "linear", color: colorName, z } }, null, 2) },
        { k: "success", v: `✓  spawned ${count} ${shape.toLowerCase()}(s) on game thread — scene updated →` },
      ]};
    }
    case "list": return { cmd: null, lines: [
      { k: "info",    v: "→ list_actors  ·  scope: current_level" },
      { k: "json",    v: JSON.stringify({ tool: "list_actors", params: { filter: "all" } }, null, 2) },
      { k: "success", v: `✓  found ${scene.actors.length} actors in "${scene.levelName}"` },
      { k: "json",    v: JSON.stringify({ actors: scene.actors.map(a => ({ name: a.name, type: a.type, location: { x: a.x, y: a.y, z: a.z } })) }, null, 2) },
    ]};
    case "move": {
      const name = match(/move\s+([\w_]+)/i) || scene.actors.find(a => a.type === "StaticMeshActor")?.name || "CubeActor_4";
      const [x, y, z] = [nums[0] ?? 200, nums[1] ?? 100, nums[2] ?? 0];
      return { cmd: { type: "MOVE", name, x, y, z }, lines: [
        { k: "info",    v: `→ move_actor  ·  actor: ${name}  ·  target: (${x}, ${y}, ${z})` },
        { k: "json",    v: JSON.stringify({ tool: "move_actor", params: { actor_name: name, location: { x, y, z } } }, null, 2) },
        { k: "success", v: `✓  ${name} moved → scene updated` },
      ]};
    }
    case "scale": {
      const name = match(/scale\s+([\w_]+)/i) || scene.actors.find(a => a.type === "StaticMeshActor")?.name || "CubeActor_4";
      const s = nums[0] || 2;
      return { cmd: { type: "SCALE", name, scale: s }, lines: [
        { k: "info",    v: `→ scale_actor  ·  actor: ${name}  ·  scale: ${s}x` },
        { k: "json",    v: JSON.stringify({ tool: "scale_actor", params: { actor_name: name, scale: s } }, null, 2) },
        { k: "success", v: `✓  ${name} scaled to ${s}x → scene updated` },
      ]};
    }
    case "delete": {
      const all = /all/i.test(prompt);
      const ids = all ? scene.actors.filter(a => a.type === "StaticMeshActor").map(a => a.id) : scene.actors.filter(a => a.type === "StaticMeshActor").slice(0, 1).map(a => a.id);
      return { cmd: { type: "DELETE", ids }, lines: [
        { k: "warn",    v: `⚠  delete_actor  ·  targets: ${ids.length} actor(s)  ·  safety read done` },
        { k: "json",    v: JSON.stringify({ tool: "delete_actor", params: { filter: all ? "StaticMeshActor" : "selected", count: ids.length } }, null, 2) },
        { k: "success", v: `✓  deleted ${ids.length} actor(s) → scene updated` },
      ]};
    }
    case "blueprint": {
      const name = match(/\b(BP_\w+)\b/) || match(/(?:named|called)\s+(\w+)/i) || "BP_NewClass";
      const parent = match(/inherit\w*\s+(?:from\s+)?(\w+)/i) || "Actor";
      return { cmd: null, lines: [
        { k: "info",    v: `→ create_blueprint  ·  class: ${name}  ·  parent: ${parent}` },
        { k: "json",    v: JSON.stringify({ tool: "create_blueprint", params: { class_name: name, parent_class: parent, path: "/Game/Blueprints/" } }, null, 2) },
        { k: "success", v: `✓  ${name} created at /Game/Blueprints/${name}` },
        { k: "plain",   v: "FKismetEditorUtilities::CreateBlueprint() · asset registered in Content Browser" },
      ]};
    }
    case "material":
    case "color": {
      const matName = /gold|metal/i.test(prompt) ? "M_Metal_Gold" : /red/i.test(prompt) ? "M_Emissive_Red" : /glass/i.test(prompt) ? "M_Glass" : /concrete/i.test(prompt) ? "M_Concrete" : "M_Emissive_Blue";
      const col = MAT_COLORS[matName] || "#58a6ff";
      const all = /all/i.test(prompt);
      const target = match(/to\s+([\w_]+)/i) || scene.actors.find(a => a.type === "StaticMeshActor")?.name || "selected";
      return { cmd: { type: "MATERIAL", name: target, all, material: matName, color: col }, lines: [
        { k: "info",    v: `→ set_material  ·  mat: ${matName}  ·  target: ${all ? "all meshes" : target}` },
        { k: "json",    v: JSON.stringify({ tool: "set_material", params: { actor: all ? "*" : target, material_path: `/Game/Materials/${matName}.${matName}` } }, null, 2) },
        { k: "success", v: `✓  material applied  ·  shader compiled → scene updated` },
      ]};
    }
    case "level": return { cmd: null, lines: [
      { k: "info",    v: "→ get_level_info  ·  scope: world_settings" },
      { k: "json",    v: JSON.stringify({ tool: "get_level_info", params: {} }, null, 2) },
      { k: "success", v: "✓  level info retrieved" },
      { k: "json",    v: JSON.stringify({ level_name: scene.levelName, actor_count: scene.actors.length, game_mode: "BP_GameMode_C", gravity: -980, time_dilation: 1.0, playing: scene.playing }, null, 2) },
    ]};
    case "play": return { cmd: { type: "PLAY" }, lines: [
      { k: "info",    v: "→ play_level  ·  mode: PIE" },
      { k: "json",    v: JSON.stringify({ tool: "play_level", params: { mode: "PIE" } }, null, 2) },
      { k: "success", v: "✓  play-in-editor started  ·  game thread running" },
    ]};
    case "stop": return { cmd: { type: "STOP" }, lines: [
      { k: "info",    v: "→ stop_level  ·  end PIE" },
      { k: "success", v: "✓  PIE session ended" },
    ]};
    case "screenshot": return { cmd: null, lines: [
      { k: "info",    v: "→ take_screenshot  ·  viewport: active" },
      { k: "success", v: "✓  saved to /Saved/Screenshots/Screenshot_001.png" },
    ]};
    default: return { cmd: null, lines: [
      { k: "warn",    v: `⚠  could not parse: "${prompt.slice(0, 40)}"` },
      { k: "plain",   v: 'try: "spawn 5 cubes in a circle", "move CubeActor_4 to (200,100,0)", "apply gold material"' },
    ]};
  }
}

// ── viewport (top-down 2D scene view) ────────────────────────────────────────
function Viewport({ scene, dispatch }) {
  const W = 340, H = 220;
  const toScreen = (x, y) => ({ sx: W / 2 + x * 0.18, sy: H / 2 - y * 0.18 });

  const shapeSymbol = (a) => {
    const { sx, sy } = toScreen(a.x, a.y);
    const s = Math.max(5, Math.min(16, 8 * (a.scale || 1)));
    const opacity = a.visible ? 1 : 0.25;
    const selected = scene.selected === a.id;
    const col = a.color || "#58a6ff";
    if (a.shape === "Sphere") return (
      <g key={a.id} onClick={() => dispatch({ type: "SELECT", id: a.id })} style={{ cursor: "pointer" }}>
        {selected && <circle cx={sx} cy={sy} r={s + 3} fill="none" stroke="#fff" strokeWidth={1} strokeDasharray="3 2" opacity={.6} />}
        <circle cx={sx} cy={sy} r={s} fill={col} opacity={opacity} />
      </g>
    );
    if (a.shape === "Cylinder") return (
      <g key={a.id} onClick={() => dispatch({ type: "SELECT", id: a.id })} style={{ cursor: "pointer" }}>
        {selected && <ellipse cx={sx} cy={sy} rx={s + 3} ry={s * .55 + 3} fill="none" stroke="#fff" strokeWidth={1} strokeDasharray="3 2" opacity={.6} />}
        <ellipse cx={sx} cy={sy} rx={s} ry={s * .55} fill={col} opacity={opacity} />
      </g>
    );
    if (a.type === "DirectionalLight") return (
      <g key={a.id} style={{ opacity }}>
        <circle cx={sx} cy={sy} r={5} fill={col} opacity={.5} />
        {[0,45,90,135,180,225,270,315].map(deg => {
          const rad = deg * Math.PI / 180;
          return <line key={deg} x1={sx + Math.cos(rad)*6} y1={sy + Math.sin(rad)*6} x2={sx + Math.cos(rad)*11} y2={sy + Math.sin(rad)*11} stroke={col} strokeWidth={.8} opacity={.6} />;
        })}
      </g>
    );
    if (a.type === "PlayerStart") return (
      <g key={a.id} style={{ opacity }}>
        <polygon points={`${sx},${sy-7} ${sx+5},${sy+4} ${sx-5},${sy+4}`} fill={col} opacity={.8} />
      </g>
    );
    // default: square (Cube, Plane, generic)
    return (
      <g key={a.id} onClick={() => dispatch({ type: "SELECT", id: a.id })} style={{ cursor: "pointer" }}>
        {selected && <rect x={sx - s - 3} y={sy - s - 3} width={(s + 3) * 2} height={(s + 3) * 2} fill="none" stroke="#fff" strokeWidth={1} strokeDasharray="3 2" opacity={.6} />}
        <rect x={sx - s} y={sy - s} width={s * 2} height={s * 2} fill={col} opacity={opacity} />
      </g>
    );
  };

  return (
    <div style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", position: "relative" }}>
      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.dim, fontFamily: "monospace", display: "flex", justifyContent: "space-between" }}>
        <span>viewport  ·  top-down</span>
        <span style={{ color: scene.playing ? T.green : T.dim }}>{scene.playing ? "● PIE running" : "○ editor"}</span>
      </div>
      <svg width={W} height={H} style={{ display: "block" }}>
        {/* grid */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * H / 8} x2={W} y2={i * H / 8} stroke={T.border} strokeWidth={.4} />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={i * W / 12} y1={0} x2={i * W / 12} y2={H} stroke={T.border} strokeWidth={.4} />
        ))}
        {/* origin cross */}
        <line x1={W/2 - 8} y1={H/2} x2={W/2 + 8} y2={H/2} stroke={T.dim} strokeWidth={.8} />
        <line x1={W/2} y1={H/2 - 8} x2={W/2} y2={H/2 + 8} stroke={T.dim} strokeWidth={.8} />
        {/* actors */}
        {scene.actors.map(a => shapeSymbol(a))}
      </svg>
    </div>
  );
}

// ── scene inspector panel ─────────────────────────────────────────────────────
function Inspector({ scene, dispatch }) {
  const sel = scene.actors.find(a => a.id === scene.selected);
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.dim, fontFamily: "monospace" }}>
        scene inspector  ·  {scene.actors.length} actors
      </div>
      <div style={{ overflowY: "auto", maxHeight: 160 }}>
        {scene.actors.map(a => (
          <div
            key={a.id}
            onClick={() => dispatch({ type: "SELECT", id: a.id })}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "5px 10px",
              cursor: "pointer", borderBottom: `1px solid ${T.border}`,
              background: scene.selected === a.id ? "rgba(88,166,255,.08)" : "transparent",
              fontSize: 11, fontFamily: "monospace",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 2, background: a.color || T.muted, flexShrink: 0, opacity: a.visible ? 1 : .35 }} />
            <span style={{ flex: 1, color: T.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
            <span style={{ color: T.dim, fontSize: 10 }}>{a.type.replace("StaticMeshActor", a.shape || "Mesh")}</span>
            <span
              onClick={e => { e.stopPropagation(); dispatch({ type: "TOGGLE_VIS", id: a.id }); }}
              style={{ color: a.visible ? T.green : T.dim, fontSize: 10, cursor: "pointer", userSelect: "none" }}
            >{a.visible ? "👁" : "○"}</span>
          </div>
        ))}
      </div>
      {sel && (
        <div style={{ padding: "8px 10px", borderTop: `1px solid ${T.border}`, fontFamily: "monospace", fontSize: 10, color: T.muted }}>
          <div style={{ color: T.cyan, marginBottom: 4, fontSize: 11 }}>{sel.name}</div>
          {[["x", sel.x], ["y", sel.y], ["z", sel.z], ["scale", sel.scale]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ color: T.dim }}>{k}</span>
              <span style={{ color: T.txt }}>{v}</span>
            </div>
          ))}
          {sel.material && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: T.dim }}>mat</span><span style={{ color: T.teal }}>{sel.material}</span></div>}
        </div>
      )}
    </div>
  );
}

// ── terminal line ─────────────────────────────────────────────────────────────
const LINE_STYLES = {
  info:    { color: "#79c0ff", background: "rgba(56,139,253,.07)", borderLeft: `2px solid ${T.cyan}` },
  success: { color: "#56d364", background: "rgba(63,185,80,.07)",  borderLeft: `2px solid ${T.green}` },
  warn:    { color: "#e3b341", background: "rgba(210,153,34,.08)", borderLeft: `2px solid ${T.amber}` },
  error:   { color: "#f85149", background: "rgba(248,81,73,.07)",  borderLeft: `2px solid ${T.red}` },
  json:    { color: "#a5d6ff", background: "rgba(121,192,255,.04)", borderLeft: "2px solid #388bfd", whiteSpace: "pre", fontSize: 10 },
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

// ── quick-run macros ──────────────────────────────────────────────────────────
const MACROS = [
  { label: "spawn 5 in circle", cmd: "spawn 5 blue spheres in a circle with radius 250" },
  { label: "list actors",       cmd: "list all actors in the level" },
  { label: "gold material",     cmd: "apply gold material to all cubes" },
  { label: "spawn cube",        cmd: "spawn a red cube at position (0, 0, 100)" },
  { label: "clear scene",       cmd: "delete all static mesh actors" },
  { label: "play PIE",          cmd: "start play in editor" },
];

// ── stat badge ────────────────────────────────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 6, padding: "6px 10px", border: `1px solid ${T.border}`, minWidth: 60, textAlign: "center" }}>
      <div style={{ fontSize: 9, color: T.dim, fontFamily: "monospace", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: color || T.txt, fontFamily: "monospace", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// ── main app ──────────────────────────────────────────────────────────────────
export default function UnrealMCPTerminal() {
  const [scene, dispatch] = useReducer(sceneReducer, initScene);
  const [lines, setLines] = useState([
    { k: "system", v: "Unreal-MCP v2.0  ·  UE5 Remote Control API  ·  Port 30020" },
    { k: "system", v: "MCP server localhost:8000  ·  scene viewport active" },
    { k: "divider", v: "" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const termRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines, thinking]);

  const meshCount = scene.actors.filter(a => a.type === "StaticMeshActor").length;

  const run = useCallback(async (prompt) => {
    const p = (prompt || input).trim();
    if (!p || busy) return;
    setBusy(true);
    setInput("");
    setLines(prev => [...prev, { k: "prompt", v: p }]);
    setThinking(true);
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
    setThinking(false);

    const type = classify(p);
    const { cmd, lines: newLines } = parseCommand(type, p, scene);

    for (const l of newLines) {
      await new Promise(r => setTimeout(r, 60));
      setLines(prev => [...prev, l]);
    }
    if (cmd) dispatch(cmd);
    setLines(prev => [...prev, { k: "divider", v: "" }]);
    setBusy(false);
    textRef.current?.focus();
  }, [input, busy, scene]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bg1, color: T.txt, fontFamily: "monospace", overflow: "hidden" }}>
      <style>{`
        @keyframes blink{0%,80%,100%{opacity:0}40%{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${T.borderB};border-radius:2px}
        .trow:hover{background:rgba(255,255,255,.04)!important}
        .macropill:hover{background:rgba(88,166,255,.1)!important;color:${T.cyan}!important;border-color:rgba(88,166,255,.35)!important}
        .toolitem:hover{background:rgba(255,255,255,.05)!important}
        textarea::placeholder{color:${T.dim}}
        textarea{caret-color:${T.cyan}}
      `}</style>

      {/* ── top bar ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg2, gap: 12, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0d1a30", border: `1px solid ${T.borderB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="15" height="15" viewBox="0 0 15 15"><rect x="1" y="1" width="5.5" height="5.5" rx="1" fill={T.cyan}/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" fill={T.purple}/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" fill={T.purple}/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill={T.green}/></svg>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Unreal-MCP Terminal</div>
          <div style={{ fontSize: 9, color: T.dim }}>AI · MCP · UE5 Remote Control</div>
        </div>
        <div style={{ flex: 1 }} />
        <Stat label="actors" value={scene.actors.length} color={T.cyan} />
        <Stat label="meshes" value={meshCount} color={T.purple} />
        <Stat label="status" value={scene.playing ? "PIE" : "editor"} color={scene.playing ? T.green : T.muted} />
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: T.bg3, borderRadius: 6, border: `1px solid ${T.border}` }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: T.muted }}>:30020</span>
        </div>
      </div>

      {/* ── body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: tool palette ── */}
        <div style={{ width: 195, borderRight: `1px solid ${T.border}`, background: T.bg0, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
          {TOOLS.map(group => (
            <div key={group.group}>
              <div
                onClick={() => setActiveGroup(g => g === group.group ? null : group.group)}
                style={{ padding: "7px 11px", fontSize: 9, color: T.dim, letterSpacing: ".1em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
              >
                <span>{group.group}</span>
                <span style={{ color: group.color, fontSize: 11 }}>{activeGroup === group.group ? "−" : "+"}</span>
              </div>
              {(activeGroup === null || activeGroup === group.group) && group.items.map(tool => (
                <div
                  key={tool.name}
                  className="toolitem"
                  onClick={() => { setInput(tool.tpl); textRef.current?.focus(); }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "8px 11px", cursor: "pointer", borderBottom: `1px solid ${T.border}`, background: "transparent" }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: tool.color || group.color, flexShrink: 0, marginTop: 4 }} />
                  <div>
                    <div style={{ fontSize: 11, color: T.txt }}>{tool.name}</div>
                    <div style={{ fontSize: 9, color: T.dim, marginTop: 1 }}>{tool.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── CENTER: terminal ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* terminal output */}
          <div ref={termRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", background: T.bg0 }}>
            {lines.map((line, i) => <TermLine key={i} line={line} />)}
            {thinking && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.dim, fontSize: 11, padding: "4px 0" }}>
                <span style={{ color: "#388bfd" }}>MCP</span>
                <span>routing</span>
                {[0, 180, 360].map(d => <span key={d} style={{ animation: `blink 1.1s ${d}ms infinite`, display: "inline-block" }}>.</span>)}
              </div>
            )}
          </div>

          {/* macro pills */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "6px 12px", background: T.bg2, display: "flex", gap: 5, flexWrap: "wrap" }}>
            {MACROS.map(m => (
              <button key={m.label} className="macropill" onClick={() => run(m.cmd)}
                style={{ padding: "3px 9px", fontSize: 10, border: `1px solid ${T.border}`, borderRadius: 20, cursor: "pointer", color: T.muted, background: "transparent", fontFamily: "monospace" }}>
                {m.label}
              </button>
            ))}
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
                  placeholder="describe what you want Unreal to do..."
                  style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontFamily: "monospace", fontSize: 12, color: T.txt, padding: "9px 0", lineHeight: 1.5, maxHeight: 90 }}
                />
              </div>
              <button
                onClick={() => run()}
                disabled={busy || !input.trim()}
                style={{ padding: "9px 16px", background: busy ? "transparent" : "rgba(63,185,80,.1)", border: `1px solid ${busy || !input.trim() ? T.border : T.green}`, borderRadius: 7, cursor: busy || !input.trim() ? "not-allowed" : "pointer", color: busy ? T.dim : T.green, fontSize: 11, fontFamily: "monospace", height: 40, whiteSpace: "nowrap", transition: "all .2s" }}
              >{busy ? "running…" : "run ↵"}</button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: viewport + inspector ── */}
        <div style={{ width: 360, borderLeft: `1px solid ${T.border}`, background: T.bg2, display: "flex", flexDirection: "column", gap: 0, flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, fontSize: 9, color: T.dim, letterSpacing: ".08em" }}>SCENE VIEW</div>
          <div style={{ padding: "8px 10px" }}>
            <Viewport scene={scene} dispatch={dispatch} />
          </div>
          <div style={{ padding: "0 10px 8px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Inspector scene={scene} dispatch={dispatch} />
          </div>

          {/* quick actions */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: T.dim, marginBottom: 6, letterSpacing: ".08em" }}>QUICK ACTIONS</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[
                { label: "+ Cube",   cmd: "spawn a blue cube",           color: T.cyan },
                { label: "+ Sphere", cmd: "spawn a purple sphere",       color: T.purple },
                { label: "◉ Circle", cmd: "spawn 6 spheres in a circle with radius 200", color: T.teal },
                { label: "⌫ Clear",  cmd: "delete all static mesh actors", color: T.red },
                { label: "▶ Play",   cmd: scene.playing ? "stop play in editor" : "start play in editor", color: scene.playing ? T.red : T.green },
              ].map(a => (
                <button key={a.label} onClick={() => run(a.cmd)}
                  style={{ padding: "4px 9px", fontSize: 10, border: `1px solid ${T.border}`, borderRadius: 5, cursor: "pointer", color: a.color, background: "transparent", fontFamily: "monospace" }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
