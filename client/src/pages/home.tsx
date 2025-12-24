import { Navbar } from "@/components/layout/Navbar";
import { BillAnalyzer } from "@/components/analysis/BillAnalyzer";
import generatedImage from '@assets/generated_images/medical_analysis_abstract_3d_composition.png';
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="flex flex-col items-center">
          <BillAnalyzer />
        </div>
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
    </div>
  );
}
