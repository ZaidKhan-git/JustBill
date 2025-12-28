/**
 * Price Comparison Service
 * 
 * Matches parsed bill items against government price database
 * and calculates overcharges.
 * 
 * Uses fuzzy matching (Fuse.js style logic) to handle variations
 * in item naming across hospitals.
 */

import { ParsedBillItem } from './parser';

export interface PriceComparisonResult {
    itemName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalBilled: number;
    govtCeilingPrice: number | null;
    overchargeAmount: number;
    status: 'fair' | 'overcharged' | 'suspicious' | 'not_found';
    priceSource: string | null;
    sourceDate: Date | null;
    notes?: string;
}

export interface GovtPriceEntry {
    id: number;
    categoryId: number;
    categoryName: string;
    itemName: string;
    itemCode: string | null;
    ceilingPrice: number;
    unit: string | null;
    source: string;
    publishedDate: Date;
}

/**
 * Simple fuzzy matching score (0-1)
 * Higher score = better match
 */
function fuzzyScore(query: string, target: string): number {
    const q = query.toLowerCase().trim();
    const t = target.toLowerCase().trim();

    // Exact match
    if (q === t) return 1;

    // Contains match
    if (t.includes(q) || q.includes(t)) {
        const longer = Math.max(q.length, t.length);
        const shorter = Math.min(q.length, t.length);
        return shorter / longer;
    }

    // Word-based matching
    const qWords = q.split(/\s+/).filter(w => w.length > 2);
    const tWords = t.split(/\s+/).filter(w => w.length > 2);

    let matchedWords = 0;
    for (const qw of qWords) {
        for (const tw of tWords) {
            if (tw.includes(qw) || qw.includes(tw)) {
                matchedWords++;
                break;
            }
        }
    }

    if (qWords.length === 0) return 0;
    return matchedWords / qWords.length;
}

/**
 * Find best matching government price for an item
 */
function findBestMatch(
    item: ParsedBillItem,
    priceDatabase: GovtPriceEntry[]
): GovtPriceEntry | null {
    let bestMatch: GovtPriceEntry | null = null;
    let bestScore = 0;
    const THRESHOLD = 0.4; // Minimum score to consider a match

    // Filter by category first for better matching
    const categoryFiltered = priceDatabase.filter(
        p => p.categoryName.toLowerCase() === item.category.toLowerCase()
    );

    // Search in category-filtered first, then all
    const searchSets = [categoryFiltered, priceDatabase];

    for (const entries of searchSets) {
        for (const entry of entries) {
            const score = fuzzyScore(item.itemName, entry.itemName);

            // Boost score if category also matches
            const categoryBoost =
                entry.categoryName.toLowerCase() === item.category.toLowerCase() ? 0.1 : 0;

            const totalScore = score + categoryBoost;

            if (totalScore > bestScore && totalScore >= THRESHOLD) {
                bestScore = totalScore;
                bestMatch = entry;
            }
        }

        // If found good match in first set, don't search further
        if (bestMatch && bestScore > 0.7) break;
    }

    return bestMatch;
}

/**
 * Compare parsed bill items against price database
 */
export function comparePrices(
    items: ParsedBillItem[],
    priceDatabase: GovtPriceEntry[]
): PriceComparisonResult[] {
    return items.map(item => {
        const match = findBestMatch(item, priceDatabase);

        if (!match) {
            // No matching price found
            return {
                itemName: item.itemName,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice || item.totalBilled / item.quantity,
                totalBilled: item.totalBilled,
                govtCeilingPrice: null,
                overchargeAmount: 0,
                status: 'not_found' as const,
                priceSource: null,
                sourceDate: null,
                notes: 'No government reference price found for this item',
            };
        }

        const unitPriceCharged = item.unitPrice || item.totalBilled / item.quantity;
        const ceilingPrice = match.ceilingPrice;

        // Calculate overcharge
        let overchargePerUnit = unitPriceCharged - ceilingPrice;
        let overchargeTotal = overchargePerUnit * item.quantity;

        // Determine status
        let status: 'fair' | 'overcharged' | 'suspicious' | 'not_found';
        let notes: string | undefined;

        if (overchargePerUnit <= 0) {
            status = 'fair';
            overchargeTotal = 0;
            notes = 'Price is at or below government ceiling';
        } else if (overchargePerUnit / ceilingPrice > 1) {
            // More than 100% above ceiling - suspicious
            status = 'suspicious';
            notes = `Charged ${((overchargePerUnit / ceilingPrice) * 100).toFixed(0)}% above ceiling price`;
        } else {
            status = 'overcharged';
            notes = `Charged ₹${overchargePerUnit.toFixed(2)} above ceiling per unit`;
        }

        return {
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            unitPrice: unitPriceCharged,
            totalBilled: item.totalBilled,
            govtCeilingPrice: ceilingPrice,
            overchargeAmount: Math.max(0, overchargeTotal),
            status,
            priceSource: `${match.source} (${match.itemCode || 'N/A'})`,
            sourceDate: match.publishedDate,
            notes,
        };
    });
}

/**
 * Calculate analysis summary
 */
export function calculateSummary(results: PriceComparisonResult[]) {
    const totalBilled = results.reduce((sum, r) => sum + r.totalBilled, 0);
    const totalOvercharge = results.reduce((sum, r) => sum + r.overchargeAmount, 0);
    const totalFairPrice = results.reduce((sum, r) => {
        if (r.govtCeilingPrice) {
            return sum + (r.govtCeilingPrice * r.quantity);
        }
        return sum + r.totalBilled;
    }, 0);

    const overchargedCount = results.filter(r => r.status === 'overcharged' || r.status === 'suspicious').length;
    const fairCount = results.filter(r => r.status === 'fair').length;
    const notFoundCount = results.filter(r => r.status === 'not_found').length;

    return {
        totalBilled,
        totalFairPrice,
        totalOvercharge,
        overchargedCount,
        fairCount,
        notFoundCount,
        itemCount: results.length,
        savingsPercent: totalBilled > 0 ? (totalOvercharge / totalBilled * 100) : 0,
    };
}
