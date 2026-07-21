import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unreal MCP - The Ultimate AI Editor",
  description: "Connect your LLMs to Unreal Engine dynamically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
