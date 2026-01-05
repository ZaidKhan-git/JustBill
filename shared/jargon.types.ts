/**
 * TypeScript interfaces for the Jargon Buster feature
 */

/** Request body for the jargon explain endpoint */
export interface JargonRequest {
    term: string;
}

/** The explanation payload from DeepSeek */
export interface JargonExplanation {
    /** Plain-English explanation (under 50 words) */
    explanation: string;
    /** Fair price estimate range in INR (e.g., "₹500-₹1,500") */
    estimated_cost: string;
}

/** Full API response including cache status */
export interface JargonResponse extends JargonExplanation {
    /** Whether this response was served from cache */
    cached: boolean;
}

/** Error response for the jargon endpoint */
export interface JargonErrorResponse {
    error: string;
    fallback_message: string;
}
