import { Navbar } from "@/components/layout/Navbar";
import { BillAnalyzer } from "@/components/analysis/BillAnalyzer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20">
      <Navbar />
      
      <main className="container mx-auto px-6 py-16">
        <div className="flex flex-col items-center">
          <BillAnalyzer />
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>
    </div>
  );
}
