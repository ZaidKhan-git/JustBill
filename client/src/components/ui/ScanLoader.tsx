import { motion } from 'framer-motion';
import { FileText, Activity, ScanLine, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScanLoaderProps {
    progress: number;
    currentStep: string;
    className?: string;
}

export function ScanLoader({ progress, currentStep, className }: ScanLoaderProps) {
    return (
        <div className={cn("relative flex flex-col items-center justify-center w-full max-w-md mx-auto p-8", className)}>

            {/* Central Visual */}
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">

                {/* Heartbeat Pulse Ring */}
                <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-100 w-full h-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [1, 1.5],
                        opacity: [0.5, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                />

                <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200 w-full h-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [1, 1.2],
                        opacity: [0.8, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.5
                    }}
                />

                {/* Central Icon Container */}
                <div className="relative z-10 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 overflow-hidden">
                    <FileText className="w-10 h-10 text-slate-300" />

                    {/* Success Overlay (fades in near end) */}
                    <motion.div
                        className="absolute inset-0 bg-green-50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: progress > 90 ? 1 : 0 }}
                    >
                        <ShieldCheck className="w-10 h-10 text-green-600" />
                    </motion.div>

                    {/* Scanning Beam - Inside the icon container for cleaner look */}
                    <motion.div
                        className="absolute w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.6)] z-20"
                        initial={{ top: "-10%" }}
                        animate={{
                            top: ["-10%", "110%", "-10%"],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                </div>

                {/* Floating Particles - Centered relative to the group */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full left-1/2 top-1/2"
                        initial={{ x: 0, y: 0, opacity: 0 }}
                        animate={{
                            x: Math.random() * 80 - 40,
                            y: Math.random() * 80 - 40,
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.7,
                            repeatType: "reverse"
                        }}
                    />
                ))}
            </div>

            {/* Text Content */}
            <div className="text-center space-y-4 w-full">
                <motion.h3
                    key={currentStep} // Animate on change
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-bold text-slate-900"
                >
                    {currentStep}
                </motion.h3>

                <div className="space-y-2 max-w-xs mx-auto">
                    <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                            Processing
                        </span>
                        <span>{Math.round(progress)}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 20, damping: 10 }}
                        />
                    </div>
                </div>

                <p className="text-xs text-slate-400 max-w-[200px] mx-auto pt-2">
                    Securely analyzing medical definitions and pricing standards...
                </p>
            </div>
        </div>
    );
}
