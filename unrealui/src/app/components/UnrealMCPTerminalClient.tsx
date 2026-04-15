"use client";

import dynamic from "next/dynamic";

const UnrealMCPTerminal = dynamic(() => import("./UnrealMCPTerminal"), {
  ssr: false,
});

export default function UnrealMCPTerminalClient() {
  return <UnrealMCPTerminal />;
}