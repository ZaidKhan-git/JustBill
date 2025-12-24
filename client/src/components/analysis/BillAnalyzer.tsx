import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { AnalysisResult } from './AnalysisResult';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type AnalysisState = 'idle' | 'analyzing' | 'complete';

const MOCK_RESULT = {
  hospitalName: "City General Hospital",
  date: "Dec 24, 2024",
  totalBilled: 1250.00,
  totalFair: 1080.00,
  tax: 125.00,
  items: [
    { id: '1', name: "MRI Scan (Brain)", category: "Test", billedAmount: 800, govtRate: 650, status: "overcharged" as const },
    { id: '2', name: "Specialist Consultation", category: "Treatment", billedAmount: 150, govtRate: 150, status: "fair" as const },
    { id: '3', name: "Pharmacy Kit (Standard)", category: "Medicine", billedAmount: 200, govtRate: 180, status: "overcharged" as const, notes: "Non-standard components" },
    { id: '4', name: "Nursing Charges (4h)", category: "Other", billedAmount: 100, govtRate: 100, status: "fair" as const },
  ]
};

export function BillAnalyzer() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (file: File) => {
    setState('analyzing');
    setProgress(0);
  };

  useEffect(() => {
    if (state === 'idle' || state === 'complete') return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 50);

    let timeout: NodeJS.Timeout;

    if (state === 'analyzing') {
      timeout = setTimeout(() => { setState('complete'); }, 3500);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [state]);

  const resetAnalysis = () => {
    setState('idle');
    setProgress(0);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="max-w-2xl mx-auto space-y-3 text-center">
              <h1 className="text-5xl font-semibold text-slate-950">
                Verify Your Hospital Bill
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Upload your medical bill to compare costs against government standards and identify any overcharges.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-xl border border-slate-200 max-w-2xl mx-auto">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          </motion.div>
        )}

        {state === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[300px] max-w-xl mx-auto p-8"
          >
            <div className="mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-slate-950 mb-2">
              Analyzing Bill
            </h3>
            
            <p className="text-slate-600 mb-6 text-center max-w-sm">
              Processing document and comparing against government pricing standards.
            </p>

            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}

        {state === 'complete' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <div className="mb-6">
              <button 
                onClick={resetAnalysis}
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors"
              >
                ← Analyze Another Bill
              </button>
            </div>
            <AnalysisResult data={MOCK_RESULT} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
