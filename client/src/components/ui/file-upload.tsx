import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-slate-200 hover:border-primary/50 hover:bg-slate-50",
          file ? "bg-white border-solid border-slate-200" : "bg-white"
        )}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-12 px-4 text-center"
            >
              <div className="mb-4 rounded-full bg-blue-50 p-4 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                Upload your medical bill
              </h3>
              <p className="mb-6 text-sm text-slate-500 max-w-xs mx-auto">
                Drag and drop your image or PDF here, or click to browse files
              </p>
              <div className="flex gap-3 text-xs text-slate-400 font-medium">
                <span className="px-2 py-1 bg-slate-100 rounded">JPG</span>
                <span className="px-2 py-1 bg-slate-100 rounded">PNG</span>
                <span className="px-2 py-1 bg-slate-100 rounded">PDF</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                onClick={removeFile}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
