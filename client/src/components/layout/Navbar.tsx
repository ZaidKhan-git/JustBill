import { Link } from "wouter";
import { ShieldCheck, Menu } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-slate-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <img src="/logo.png" alt="JustBill Logo" className="h-16 w-16 object-contain" />
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            JustBill
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">Documentation</a>
          <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">Standards</a>
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}
