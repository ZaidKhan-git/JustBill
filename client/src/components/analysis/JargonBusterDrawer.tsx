import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, IndianRupee, AlertCircle } from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from '@/components/ui/drawer';
import { apiRequest } from '@/lib/queryClient';
import type { JargonResponse, JargonErrorResponse } from '../../../../shared/jargon.types';

interface JargonBusterDrawerProps {
    /** The medical term to explain */
    term: string | null;
    /** Whether the drawer is open */
    isOpen: boolean;
    /** Callback to close the drawer */
    onClose: () => void;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Bottom sheet drawer that shows medical term explanations
 * Uses DeepSeek API via backend proxy
 */
export function JargonBusterDrawer({ term, isOpen, onClose }: JargonBusterDrawerProps) {
    const [state, setState] = useState<FetchState>('idle');
    const [data, setData] = useState<JargonResponse | null>(null);
    const [error, setError] = useState<string>('');

    // Fetch explanation when term changes and drawer opens
    useEffect(() => {
        if (!term || !isOpen) {
            return;
        }

        const fetchExplanation = async () => {
            setState('loading');
            setData(null);
            setError('');

            try {
                const response = await apiRequest('POST', '/api/jargon/explain', { term });
                const result = await response.json();

                // Check if it's an error response
                if ('fallback_message' in result) {
                    setError((result as JargonErrorResponse).fallback_message);
                    setState('error');
                } else {
                    setData(result as JargonResponse);
                    setState('success');
                }
            } catch (err) {
                setError('Unable to fetch explanation. Please check local medical listings.');
                setState('error');
            }
        };

        fetchExplanation();
    }, [term, isOpen]);

    // Reset state when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setState('idle');
            setData(null);
            setError('');
        }
    }, [isOpen]);

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="max-h-[85vh]">
                <div className="mx-auto w-full max-w-lg">
                    <DrawerHeader className="relative">
                        <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DrawerClose>
                        <DrawerTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            Jargon Buster
                        </DrawerTitle>
                        <DrawerDescription className="text-sm text-slate-500">
                            {term ? `Understanding: "${term}"` : 'Loading...'}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 pb-8">
                        <AnimatePresence mode="wait">
                            {/* Loading State */}
                            {state === 'loading' && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                                        <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
                                        <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
                                    </div>
                                    <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                                </motion.div>
                            )}

                            {/* Success State */}
                            {state === 'success' && data && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    {/* Explanation */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-blue-700 mb-2">What does this mean?</h4>
                                        <p className="text-slate-700 leading-relaxed">{data.explanation}</p>
                                    </div>

                                    {/* Cost Estimate */}
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IndianRupee className="w-4 h-4 text-green-600" />
                                            <h4 className="text-sm font-medium text-green-700">Fair Price Estimate</h4>
                                        </div>
                                        <p className="text-2xl font-bold text-green-800">{data.estimated_cost}</p>
                                        <p className="text-xs text-green-600 mt-1">
                                            Based on typical rates across India
                                        </p>
                                    </div>

                                    {/* Cache indicator (subtle) */}
                                    {data.cached && (
                                        <p className="text-xs text-slate-400 text-center">
                                            ⚡ Served from cache
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {/* Error State */}
                            {state === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-medium text-amber-700 mb-1">
                                                Couldn't fetch explanation
                                            </h4>
                                            <p className="text-sm text-amber-600">{error}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
