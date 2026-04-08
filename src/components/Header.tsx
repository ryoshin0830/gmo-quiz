import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#003080] to-[#0046AC] text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg font-bold">
            Q
          </div>
          <span className="text-xl font-bold tracking-tight">
            Quiz<span className="text-blue-300">ARD</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-blue-200/80 text-xs hidden sm:block">
            Powered by AI
          </span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>
    </header>
  );
}
