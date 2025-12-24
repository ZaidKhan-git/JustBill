import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { AnalysisResult } from './AnalysisResult';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, BrainCircuit, CheckCircle, Loader2 } from 'lucide-react';

type AnalysisState = 'idle' | 'scanning' | 'processing' | 'verifying' | 'complete';

const MOCK_RESULT = {
  hospitalName: "City General Hospital",
  date: "Dec 24, 2024",
  totalBilled: 1250.00,
  totalFair: 1080.00,
  tax: 125.00,
  items: [
    { id: '1', name: "MRI Scan (Brain)", category: "Test", billedAmount: 800, govtRate: 650, status: "overcharged" as const },
    { id: '2', name: "Specialist Consultation", category: "Treatment", billedAmount: 150, govtRate: 150, status: "fair" as const },
    { id: '3', name: "Pharmacy Kit (Standard)", category: "Medicine", billedAmount: 200, govtRate: 180, status: "overcharged" as const, notes: "Includes non-essential supplements" },
    { id: '4', name: "Nursing Charges (4h)", category: "Other", billedAmount: 100, govtRate: 100, status: "fair" as const },
  ]
};

export function BillAnalyzer() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (file: File) => {
    setState('scanning');
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

    if (state === 'scanning') {
      timeout = setTimeout(() => { setState('processing'); setProgress(0); }, 2500);
    } else if (state === 'processing') {
      timeout = setTimeout(() => { setState('verifying'); setProgress(0); }, 2500);
    } else if (state === 'verifying') {
      timeout = setTimeout(() => { setState('complete'); }, 2000);
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 text-center"
          >
            <div className="max-w-2xl mx-auto space-y-4">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight">
                Are you paying the <span className="text-primary">fair price?</span>
              </h1>
              <p className="text-lg text-slate-500">
                Upload your hospital bill. We'll analyze every line item against government standard rates to find hidden charges.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 max-w-3xl mx-auto">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>

            <div className="flex justify-center gap-8 pt-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" className="h-6 object-contain" alt="Partner 1" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/HHS_logo.svg/1024px-HHS_logo.svg.png" className="h-6 object-contain" alt="Partner 2" />
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest self-center">Trusted By 10k+ Patients</div>
            </div>
          </motion.div>
        )}

        {(state === 'scanning' || state === 'processing' || state === 'verifying') && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center min-h-[400px] max-w-xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 text-center relative overflow-hidden"
          >
             {/* Background Pulse */}
             <div className="absolute inset-0 bg-blue-50/30 animate-pulse pointer-events-none" />

            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center relative z-10">
                {state === 'scanning' && <Scan className="w-10 h-10 text-primary animate-pulse" />}
                {state === 'processing' && <BrainCircuit className="w-10 h-10 text-indigo-500 animate-pulse" />}
                {state === 'verifying' && <CheckCircle className="w-10 h-10 text-teal-500 animate-pulse" />}
              </div>
              
              {/* Spinner Ring */}
              <div className="absolute inset-0 -m-2 border-4 border-slate-100 rounded-full" />
              <div className="absolute inset-0 -m-2 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {state === 'scanning' && 'Scanning Document...'}
              {state === 'processing' && 'Analyzing Line Items...'}
              {state === 'verifying' && 'Checking Govt Rates...'}
            </h3>
            
            <p className="text-slate-500 mb-8 max-w-sm">
              {state === 'scanning' && 'Our AI is reading the text from your image to identify medical services.'}
              {state === 'processing' && 'We are classifying medicines, tests, and treatments into standard categories.'}
              {state === 'verifying' && 'Comparing billed amounts against the latest government price control database.'}
            </p>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
             <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={resetAnalysis}
                  className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
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
