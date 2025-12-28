import { useState, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { LocationSelector } from './LocationSelector';
import { AnalysisResult } from './AnalysisResult';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Zap, AlertCircle, Info, FileX, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error' | 'invalid_bill';

interface ReferenceInfo {
  sources: Array<{
    name: string;
    itemCount: number;
    publishedDate: string;
  }>;
  totalItems: number;
}

export function BillAnalyzer() {
  const { sessionId } = useAuth();
  const [state, setState] = useState<AnalysisState>('idle');
  const [progress, setProgress] = useState(0);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidBillMessage, setInvalidBillMessage] = useState<string | null>(null);
  const [referenceInfo, setReferenceInfo] = useState<ReferenceInfo | null>(null);

  // Fetch reference data info on mount
  useEffect(() => {
    fetchReferenceInfo();
  }, []);

  const fetchReferenceInfo = async () => {
    try {
      const res = await fetch('/api/reference-info');
      if (res.ok) {
        setReferenceInfo(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch reference info:', error);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setState('analyzing');
    setProgress(0);
    setAnalyzeStep(0);
    setError(null);

    // Simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + 5;
      });
    }, 200);

    // Update step based on progress
    const stepInterval = setInterval(() => {
      setAnalyzeStep(prev => {
        if (prev >= 2) return 2;
        return prev + 1;
      });
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('billImage', file);
      formData.append('stateId', String(selectedStateId || 32)); // Default to Delhi

      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });

      clearInterval(progressInterval);
      clearInterval(stepInterval);

      if (!response.ok) {
        const errorData = await response.json();
        // Check if it's a "not medical bill" error
        if (errorData.error === 'not_medical_bill') {
          setInvalidBillMessage(errorData.message || 'This does not appear to be a medical bill.');
          setState('invalid_bill');
          return;
        }
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setProgress(100);
      setAnalyzeStep(2);

      setTimeout(() => {
        setAnalysisResult(result);
        setState('complete');
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setState('error');
    }
  }, [selectedStateId, sessionId]);

  const resetAnalysis = () => {
    setState('idle');
    setProgress(0);
    setAnalyzeStep(0);
    setAnalysisResult(null);
    setError(null);
    setInvalidBillMessage(null);
  };

  // Demo mode - analyze without uploading
  const handleDemoAnalyze = async () => {
    setState('analyzing');
    setProgress(0);
    setAnalyzeStep(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 150);

    const stepInterval = setInterval(() => {
      setAnalyzeStep(prev => Math.min(prev + 1, 2));
    }, 1200);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ stateId: selectedStateId || 32 }),
      });

      clearInterval(progressInterval);
      clearInterval(stepInterval);

      if (!response.ok) {
        throw new Error('Demo analysis failed');
      }

      const result = await response.json();
      setProgress(100);
      setAnalyzeStep(2);

      setTimeout(() => {
        setAnalysisResult(result);
        setState('complete');
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'Demo failed');
      setState('error');
    }
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

            {/* Location Selector */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              <LocationSelector
                selectedStateId={selectedStateId}
                onStateChange={setSelectedStateId}
              />
            </motion.div>

            <motion.div
              className="p-8 bg-white rounded-2xl border border-slate-200 max-w-2xl mx-auto shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <FileUpload onFileSelect={handleFileSelect} />

              {/* Demo button */}
              <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                <button
                  onClick={handleDemoAnalyze}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Or try with a demo bill →
                </button>
              </div>
            </motion.div>

            {/* Reference Info */}
            {referenceInfo && (
              <motion.div
                className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm">Reference Data</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Comparing against {referenceInfo.totalItems} government-listed items from:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {referenceInfo.sources.map(source => (
                        <li key={source.name} className="text-xs text-blue-800 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          <span className="font-medium">{source.name}</span>
                          <span className="text-blue-600">
                            ({source.itemCount} items, published {source.publishedDate})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

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

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px]"
          >
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-2">Analysis Failed</h3>
              <p className="text-slate-600 mb-6">{error || 'Something went wrong. Please try again.'}</p>
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {state === 'invalid_bill' && (
          <motion.div
            key="invalid_bill"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px]"
          >
            <div className="text-center max-w-lg">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileX className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-950 mb-3">Not a Medical Bill</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-800 text-sm leading-relaxed">
                  {invalidBillMessage || 'The uploaded document does not appear to be a hospital or medical bill.'}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-slate-800 text-sm mb-2">What we accept:</h4>
                <ul className="text-slate-600 text-sm space-y-1 text-left">
                  <li>• Hospital discharge bills</li>
                  <li>• Pharmacy receipts</li>
                  <li>• Diagnostic lab reports with charges</li>
                  <li>• Doctor consultation bills</li>
                </ul>
              </div>
              <button
                onClick={resetAnalysis}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors mx-auto"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </div>
          </motion.div>
        )}

        {state === 'complete' && analysisResult && (
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
            <AnalysisResult data={analysisResult} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
