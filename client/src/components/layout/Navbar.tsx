import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-blue-50/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              Medi<span className="text-primary">Scan</span>
            </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">How it works</a>
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Govt Pricing</a>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer">
            Get App
          </button>
        </div>
      </div>
    </nav>
  );
}
