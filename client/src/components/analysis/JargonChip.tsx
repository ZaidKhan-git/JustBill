import { HelpCircle } from 'lucide-react';

interface JargonChipProps {
    /** The medical term to display */
    term: string;
    /** Callback when the chip is clicked */
    onExplain: (term: string) => void;
    /** Optional className for additional styling */
    className?: string;
}

/**
 * A clickable chip that wraps medical terms
 * Click to open the Jargon Buster drawer with an explanation
 */
export function JargonChip({ term, onExplain, className = '' }: JargonChipProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onExplain(term);
    };

    return (
        <button
            onClick={handleClick}
            className={`
        group inline-flex items-center gap-1
        text-slate-900 font-medium
        border-b border-dashed border-slate-400
        hover:border-blue-500 hover:text-blue-600
        cursor-help transition-colors duration-200
        ${className}
      `}
            title="Click to learn what this means"
            aria-label={`Learn about ${term}`}
        >
            <span>{term}</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </button>
    );
}
