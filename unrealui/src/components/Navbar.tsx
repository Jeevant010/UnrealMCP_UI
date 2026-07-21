import Link from "next/link";

export default function Navbar() {
  return (
    <header className="px-6 py-4 flex justify-between items-center glass border-b border-white/10 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">U</div>
        <Link href="/" className="font-bold text-xl tracking-tight text-white hover:text-gray-200 transition-colors">
          Unreal MCP
        </Link>
      </div>
      <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
        <Link href="/features" className="hover:text-white transition-colors">Features</Link>
        <Link href="/how-it-works" className="hover:text-white transition-colors">How it Works</Link>
        <Link href="/download" className="hover:text-white transition-colors">Download App</Link>
        <Link href="/ide" className="text-blue-400 hover:text-blue-300 transition-colors">Open IDE</Link>
      </nav>
      <div>
        <Link href="/ide" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          Launch Workspace
        </Link>
      </div>
    </header>
  );
}
