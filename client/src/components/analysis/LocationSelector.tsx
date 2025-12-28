import { useState, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

interface State {
    id: number;
    name: string;
    code: string;
    tier: number;
}

interface LocationSelectorProps {
    selectedStateId: number | null;
    onStateChange: (stateId: number) => void;
}

export function LocationSelector({ selectedStateId, onStateChange }: LocationSelectorProps) {
    const [states, setStates] = useState<State[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStates();
    }, []);

    const fetchStates = async () => {
        try {
            const res = await fetch('/api/states');
            if (res.ok) {
                const data = await res.json();
                setStates(data);
                // Default to Delhi if nothing selected
                if (!selectedStateId && data.length > 0) {
                    const delhi = data.find((s: State) => s.code === 'DL');
                    onStateChange(delhi?.id || data[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch states:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedState = states.find(s => s.id === selectedStateId);

    const getTierLabel = (tier: number) => {
        switch (tier) {
            case 1: return 'Metro';
            case 2: return 'Tier 2';
            case 3: return 'Tier 3';
            default: return '';
        }
    };

    const getTierColor = (tier: number) => {
        switch (tier) {
            case 1: return 'bg-blue-100 text-blue-700';
            case 2: return 'bg-green-100 text-green-700';
            case 3: return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg animate-pulse">
                <div className="w-4 h-4 bg-slate-300 rounded" />
                <div className="w-24 h-4 bg-slate-300 rounded" />
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">
                    {selectedState?.name || 'Select State'}
                </span>
                {selectedState && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTierColor(selectedState.tier)}`}>
                        {getTierLabel(selectedState.tier)}
                    </span>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-20">
                        <div className="p-2">
                            <p className="text-xs text-slate-500 px-2 py-1 mb-1">
                                Select your state for accurate price comparison
                            </p>
                            {states.map(state => (
                                <button
                                    key={state.id}
                                    onClick={() => {
                                        onStateChange(state.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${selectedStateId === state.id
                                            ? 'bg-blue-50 text-blue-900'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <span className="font-medium">{state.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTierColor(state.tier)}`}>
                                        {getTierLabel(state.tier)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
