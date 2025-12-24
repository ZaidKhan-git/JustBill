import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { AnalysisResult } from './AnalysisResult';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Zap } from 'lucide-react';

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
  const [analyzeStep, setAnalyzeStep] = useState(0);

  const handleFileSelect = (file: File) => {
    setState('analyzing');
    setProgress(0);
    setAnalyzeStep(0);
  };

  useEffect(() => {
    if (state === 'idle' || state === 'complete') return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2.5;
      });
    }, 40);

    let timeout: NodeJS.Timeout;

    if (state === 'analyzing') {
      // Progress steps
      if (progress < 33) {
        setAnalyzeStep(0);
      } else if (progress < 66) {
        setAnalyzeStep(1);
      } else if (progress < 100) {
        setAnalyzeStep(2);
      }

      if (progress >= 100) {
        timeout = setTimeout(() => { setState('complete'); }, 500);
      }
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [state, progress]);

  const resetAnalysis = () => {
    setState('idle');
    setProgress(0);
    setAnalyzeStep(0);
  };

  const steps = [
    { label: "Scanning Document", icon: "🔍" },
    { label: "Classifying Items", icon: "🏷️" },
    { label: "Comparing Prices", icon: "💰" },
  ];

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
            <motion.div 
              className="max-w-2xl mx-auto space-y-4 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                  <Zap className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-slate-950">
                Verify Your Hospital Bill
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Upload your medical bill to instantly compare costs against government standards and identify any overcharges.
              </p>
            </motion.div>
            
            <motion.div 
              className="p-8 bg-white rounded-2xl border border-slate-200 max-w-2xl mx-auto shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <FileUpload onFileSelect={handleFileSelect} />
            </motion.div>

            <motion.div 
              className="flex justify-center gap-6 text-sm text-slate-600 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>100% Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Instant Results</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Free Analysis</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {state === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px]"
          >
            <div className="max-w-md w-full">
              <div className="mb-8">
                <div className="flex justify-between items-end gap-4">
                  {steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      className={`flex-1 transition-all ${idx <= analyzeStep ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}
                      animate={idx <= analyzeStep ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0.5 }}
                    >
                      <div className={`p-3 rounded-xl mb-2 text-center ${idx <= analyzeStep ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        <span className="text-2xl">{step.icon}</span>
                      </div>
                      <p className="text-xs text-slate-600 text-center">{step.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-950 mb-2 text-center">
                {steps[analyzeStep].label}
              </h3>
              
              <p className="text-slate-600 mb-6 text-center text-sm">
                Processing your medical bill and comparing against government pricing standards.
              </p>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-600">Progress</span>
                  <span className="text-xs font-medium text-slate-600">{Math.floor(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
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
            <motion.div 
              className="mb-6 flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <button 
                onClick={resetAnalysis}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hover:bg-slate-100 px-3 py-2 rounded-lg"
              >
                ← Analyze Another Bill
              </button>
            </motion.div>
            <AnalysisResult data={MOCK_RESULT} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
