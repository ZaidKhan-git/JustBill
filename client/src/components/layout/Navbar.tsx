import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="bg-primary p-2 rounded-md">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-lg text-slate-950">
            MediScan
          </span>
        </Link>
        
        <div className="flex items-center gap-8">
          <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Documentation</a>
          <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing Standards</a>
          <button className="bg-primary text-white px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}
