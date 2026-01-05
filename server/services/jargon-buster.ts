/**
 * Jargon Buster Service
 * Integrates with Google Gemini API to explain medical terms
 * Features: In-memory caching to avoid repeated API costs
 * Uses 'gemini-2.5-flash-lite' for speed and cost-efficiency
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logErrorToService, logInfo } from '../utils/logger';
import type { JargonExplanation, JargonResponse } from '../../shared/jargon.types';
import { storage } from '../storage';

// Initialize Gemini
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    if (!genAI) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

/**
 * System prompt definition
 */
const SYSTEM_PROMPT = `You are a medical billing translator. Given a medical term or procedure, provide:
1. A plain-English explanation in under 50 words (no medical jargon)
2. A fair price estimate range for India (in INR)

CRITICAL RULES:
- Do NOT include disclaimers like "I am an AI" or "consult a doctor"
- Get straight to the definition
- Be empathetic and reassuring in tone
- Respond ONLY with valid JSON: {"explanation": "...", "estimated_cost": "₹X-₹Y"}`;

/**
 * Check if Gemini API is available
 */
export function isDeepSeekAvailable(): boolean {
    // Keeping function name same for compatibility with routes.ts, 
    // but logically it checks for Gemini availability
    return !!process.env.GEMINI_API_KEY;
}

/**
 * Normalize a term for cache key
 */
function normalizeTerm(term: string): string {
    return term.toLowerCase().trim();
}

/**
 * Parse Gemini response text to JSON
 */
function parseGeminiResponse(text: string): JargonExplanation | null {
    try {
        // Clean up markdown code blocks if present
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find JSON object
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');

        if (start !== -1 && end !== -1) {
            cleanText = cleanText.substring(start, end + 1);
        }

        const parsed = JSON.parse(cleanText);

        if (
            typeof parsed.explanation === 'string' &&
            typeof parsed.estimated_cost === 'string' &&
            parsed.explanation.length > 0
        ) {
            return {
                explanation: parsed.explanation,
                estimated_cost: parsed.estimated_cost,
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Call Gemini API to explain a medical term
 */
async function callGeminiAPI(term: string): Promise<JargonExplanation | null> {
    const client = getGeminiClient();

    if (!client) {
        logErrorToService('Gemini API key not configured', {
            service: 'jargon-buster',
            term,
        });
        return null;
    }

    try {
        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nTerm to explain: "${term}"`);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            logErrorToService('Gemini returned empty content', {
                service: 'jargon-buster',
                term,
            });
            return null;
        }

        const parsed = parseGeminiResponse(text);

        if (!parsed) {
            logErrorToService('Failed to parse Gemini response as JSON', {
                service: 'jargon-buster',
                term,
                response: text,
            });
            return null;
        }

        return parsed;

    } catch (error: any) {
        // Handle specific Gemini errors if needed (e.g. 429 rate limit)
        logErrorToService('Gemini API request failed', {
            service: 'jargon-buster',
            term,
            error: error.message || error,
        });
        return null;
    }
}

/**
 * Get explanation for a medical term
 */
export async function explainMedicalTerm(term: string): Promise<JargonResponse | null> {
    const normalizedTerm = normalizeTerm(term);

    // Check storage (persistence) first
    const cached = await storage.getJargonTerm(normalizedTerm);
    if (cached) {
        logInfo('Persistence hit for term', { service: 'jargon-buster', term: normalizedTerm });
        return {
            explanation: cached.explanation,
            estimated_cost: cached.estimatedCost,
            cached: true,
        };
    }

    // Call API
    logInfo('Persistence miss, calling Gemini API', { service: 'jargon-buster', term: normalizedTerm });
    const explanation = await callGeminiAPI(term);

    if (!explanation) {
        return null;
    }

    // Store in persistence
    await storage.createJargonTerm({
        term: normalizedTerm,
        explanation: explanation.explanation,
        estimatedCost: explanation.estimated_cost,
    });

    return {
        ...explanation,
        cached: false,
    };
}
