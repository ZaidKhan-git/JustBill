import { Navbar } from "@/components/layout/Navbar";
import { BillAnalyzer } from "@/components/analysis/BillAnalyzer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container mx-auto px-6 py-16">
        <div className="flex flex-col items-center">
          <BillAnalyzer />
        </div>
      </main>
    </div>
  );
}
