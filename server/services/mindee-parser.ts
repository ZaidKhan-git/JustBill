/**
 * Mindee Invoice Parser with Smart Filtering
 * 
 * Uses Mindee's Invoice OCR API with intelligent post-processing
 * to filter out garbage (invoice headers, contact info, etc.)
 * and keep only real medical items.
 */

import * as mindee from 'mindee';
import { ParsedBillItem } from './parser';

// Lazy initialization for Mindee client
let mindeeClient: mindee.Client | null = null;
let mindeeInitialized = false;

function getMindeeClient(): mindee.Client | null {
    if (!mindeeInitialized) {
        const apiKey = process.env.MINDEE_API_KEY || '';
        console.log('Mindee API Key configured:', apiKey ? 'Yes' : 'No');
        if (apiKey) {
            mindeeClient = new mindee.Client({ apiKey });
        }
        mindeeInitialized = true;
    }
    return mindeeClient;
}

export interface MindeeParseResult {
    hospitalName: string;
    billDate: Date;
    billNumber?: string;
    items: ParsedBillItem[];
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    confidence: number;
}

// ============ FILTERING RULES ============

// Words that indicate this is NOT a medical item (garbage)
const GARBAGE_KEYWORDS = [
    // Document metadata
    'invoice', 'bill no', 'receipt', 'voucher', 'ref no', 'reference',
    'date', 'time', 'dated',
    // Contact info
    'contact', 'phone', 'mobile', 'tel', 'fax', 'email', 'website', 'www',
    // Tax/Legal IDs
    'gstin', 'gst no', 'pan', 'tin', 'cin', 'registration',
    // Address
    'address', 'city', 'state', 'pincode', 'zip', 'country',
    // Payment/Totals
    'total', 'subtotal', 'grand total', 'net amount', 'gross',
    'tax', 'cgst', 'sgst', 'igst', 'vat', 'cess',
    'discount', 'rebate', 'adjustment',
    'payment', 'paid', 'balance', 'due', 'cash', 'card', 'upi',
    // Document structure
    'page', 'sr no', 'sl no', 'serial', 'particulars', 'description',
    'qty', 'quantity', 'rate', 'amount', 'price', 'unit',
    // Hospital info (not items)
    'hospital', 'clinic', 'nursing', 'healthcare', 'medical centre',
    'patient', 'doctor', 'dr.', 'admission', 'discharge',
    'uhid', 'ipd', 'opd', 'mrn', 'patient id',
    // Misc
    'thank you', 'terms', 'condition', 'signature', 'authorized',
];

// Words that indicate this IS a real medical item
const MEDICAL_KEYWORDS = [
    // Medicine forms
    'tablet', 'tab', 'capsule', 'cap', 'syrup', 'suspension',
    'injection', 'inj', 'ointment', 'cream', 'gel', 'drops',
    'inhaler', 'spray', 'powder', 'sachet', 'patch',
    // Dosage indicators (these should be part of name, not filtered)
    // Tests
    'test', 'blood', 'urine', 'x-ray', 'xray', 'scan', 'mri', 'ct scan',
    'ultrasound', 'usg', 'ecg', 'ekg', 'echo', 'pathology',
    'hemoglobin', 'glucose', 'lipid', 'thyroid', 'liver', 'kidney',
    // Procedures
    'dressing', 'bandage', 'suture', 'catheter', 'cannula',
    'oxygen', 'nebulization', 'physiotherapy',
    // Room/Services
    'room charge', 'bed charge', 'icu', 'ward', 'private room',
    'nursing charge', 'diet', 'consultation',
];

// Common medicine name patterns (partial matches)
const MEDICINE_PATTERNS = [
    /paracetamol/i, /amoxicillin/i, /azithromycin/i, /ciprofloxacin/i,
    /metformin/i, /omeprazole/i, /pantoprazole/i, /ranitidine/i,
    /atorvastatin/i, /aspirin/i, /ibuprofen/i, /diclofenac/i,
    /cefixime/i, /ofloxacin/i, /levofloxacin/i, /doxycycline/i,
    /metronidazole/i, /fluconazole/i, /acyclovir/i,
    /amlodipine/i, /atenolol/i, /losartan/i, /telmisartan/i,
    /insulin/i, /glimepiride/i, /sitagliptin/i,
    /cetirizine/i, /loratadine/i, /montelukast/i,
    /prednisolone/i, /dexamethasone/i, /hydrocortisone/i,
    /salbutamol/i, /budesonide/i, /formoterol/i,
    /multivitamin/i, /vitamin/i, /calcium/i, /iron/i, /folic/i,
    /saline/i, /dextrose/i, /ringer/i,
    // Indian brand names
    /crocin/i, /dolo/i, /combiflam/i, /vicks/i, /zifi/i, /monocef/i,
    /pan\s*d/i, /pantocid/i, /rantac/i, /gelusil/i,
];

/**
 * Check if an item looks like garbage (not a real billable item)
 */
function isGarbageItem(name: string, price: number, totalBillAmount: number): boolean {
    const lowerName = name.toLowerCase().trim();

    // Too short to be meaningful
    if (lowerName.length < 3) return true;

    // Contains garbage keywords
    for (const keyword of GARBAGE_KEYWORDS) {
        if (lowerName.includes(keyword)) return true;
    }

    // Price equals total bill (it's the total line, not an item)
    if (price > 0 && Math.abs(price - totalBillAmount) < 10) return true;

    // Very high price without being a recognizable medical item
    // Phone numbers like 9876543210 often get read as prices
    if (price > 100000) {
        // Check if it's clearly a medical item
        const isClearlyMedical = MEDICAL_KEYWORDS.some(kw => lowerName.includes(kw)) ||
            MEDICINE_PATTERNS.some(pat => pat.test(lowerName));
        if (!isClearlyMedical) return true;
    }

    // Purely numeric (invoice numbers, phone numbers read as items)
    if (/^[\d\s\-\.\,\(\)]+$/.test(name)) return true;

    // Very short abbreviations that aren't medical
    if (lowerName.length <= 4 && !/mg|ml|mcg|iu/.test(lowerName)) {
        const isMedical = MEDICAL_KEYWORDS.some(kw => lowerName.includes(kw));
        if (!isMedical) return true;
    }

    return false;
}

/**
 * Check if an item looks like a real medical item
 */
function isMedicalItem(name: string): boolean {
    const lowerName = name.toLowerCase();

    // Contains dosage (mg, ml, mcg) - strong indicator
    if (/\d+\s*(mg|ml|mcg|iu|gm|kg)/i.test(name)) return true;

    // Contains medical keywords
    if (MEDICAL_KEYWORDS.some(kw => lowerName.includes(kw))) return true;

    // Matches known medicine patterns
    if (MEDICINE_PATTERNS.some(pat => pat.test(name))) return true;

    return false;
}

/**
 * Categorize a medical item
 */
function categorizeItem(name: string): ParsedBillItem['category'] {
    const lowerName = name.toLowerCase();

    // Medicines
    if (/tablet|tab|capsule|cap|syrup|injection|inj|ointment|cream|drops/i.test(lowerName) ||
        /\d+\s*(mg|ml|mcg)/i.test(lowerName) ||
        MEDICINE_PATTERNS.some(pat => pat.test(lowerName))) {
        return 'Medicine';
    }

    // Tests
    if (/test|blood|x-ray|xray|scan|mri|ct|ultrasound|usg|ecg|pathology|hemoglobin|glucose/i.test(lowerName)) {
        return 'Test';
    }

    // Room
    if (/room|bed|icu|ward|private/i.test(lowerName)) {
        return 'Room';
    }

    // Consultation
    if (/consultation|consult|doctor|physician|visit/i.test(lowerName)) {
        return 'Consultation';
    }

    // Nursing
    if (/nursing|nurse|care/i.test(lowerName)) {
        return 'Nursing';
    }

    // Consumables
    if (/dressing|bandage|syringe|glove|mask|gauze|cotton/i.test(lowerName)) {
        return 'Consumable';
    }

    return 'Other';
}

/**
 * Filter and clean parsed items
 */
function cleanParsedItems(items: ParsedBillItem[], totalBillAmount: number): ParsedBillItem[] {
    console.log('Filtering items...');

    return items.filter(item => {
        const name = item.itemName;
        const price = item.totalBilled;

        // Check if garbage
        if (isGarbageItem(name, price, totalBillAmount)) {
            console.log(`  REJECTED: "${name}" (price: ${price})`);
            return false;
        }

        // Prefer items that look medical
        const looksLikeMedicine = isMedicalItem(name);
        if (!looksLikeMedicine && price > 50000) {
            // High price + not clearly medical = suspicious
            console.log(`  REJECTED (suspicious): "${name}" (price: ${price})`);
            return false;
        }

        console.log(`  ACCEPTED: "${name}" (price: ${price})`);
        return true;
    }).map(item => ({
        ...item,
        category: categorizeItem(item.itemName),
    }));
}

// ============ MAIN PARSER ============

export async function parseWithMindee(
    imageBuffer: Buffer,
    filename: string
): Promise<MindeeParseResult | null> {
    const client = getMindeeClient();
    if (!client) {
        console.warn('Mindee API key not configured');
        return null;
    }

    try {
        console.log('Starting Mindee invoice parsing...');

        const inputSource = client.docFromBuffer(imageBuffer, filename);
        const apiResponse = await client.parse(mindee.product.InvoiceV4, inputSource);

        const prediction = apiResponse.document.inference?.pages?.[0]?.prediction ||
            apiResponse.document.inference?.prediction;

        if (!prediction) {
            console.error('No prediction from Mindee');
            return null;
        }

        console.log('Mindee raw results:');
        console.log('  Supplier:', prediction.supplierName?.value);
        console.log('  Date:', prediction.date?.value);
        console.log('  Total:', prediction.totalAmount?.value);
        console.log('  Line items:', prediction.lineItems?.length || 0);

        const hospitalName = prediction.supplierName?.value || 'Unknown Hospital';
        const billDate = prediction.date?.value ? new Date(prediction.date.value) : new Date();
        const billNumber = prediction.invoiceNumber?.value;
        const totalAmount = prediction.totalAmount?.value || 0;

        // Extract raw items
        const rawItems: ParsedBillItem[] = (prediction.lineItems || []).map((item: any) => ({
            rawText: item.description || '',
            itemName: item.description || 'Unknown Item',
            category: 'Other' as const,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalBilled: item.totalAmount || 0,
        }));

        // Clean and filter
        const cleanedItems = cleanParsedItems(rawItems, totalAmount);

        console.log(`Result: ${cleanedItems.length} valid items (from ${rawItems.length} raw)`);

        return {
            hospitalName,
            billDate,
            billNumber,
            items: cleanedItems,
            subtotal: prediction.totalNet?.value || 0,
            totalTax: prediction.totalTax?.value || 0,
            totalAmount,
            confidence: cleanedItems.length > 0 ? 90 : 70,
        };
    } catch (error: any) {
        console.error('Mindee error:', error.message);
        return null;
    }
}

export function isMindeeAvailable(): boolean {
    return !!getMindeeClient();
}
