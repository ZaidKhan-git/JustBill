/**
 * AI Bill Parser using Google Gemini API
 * 
 * Uses TWO approaches:
 * 1. Direct image analysis with Gemini Vision (preferred)
 * 2. OCR text + Gemini text parsing (fallback)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization - will be set on first use
let genAI: GoogleGenerativeAI | null = null;
let initialized = false;

function getGeminiClient(): GoogleGenerativeAI | null {
    if (!initialized) {
        const apiKey = process.env.GEMINI_API_KEY || '';
        console.log('Gemini API Key configured:', apiKey ? 'Yes' : 'No');
        if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
            genAI = new GoogleGenerativeAI(apiKey);
        }
        initialized = true;
    }
    return genAI;
}

export interface AIExtractedBillItem {
    itemName: string;
    category: 'Medicine' | 'Test' | 'Room' | 'Consultation' | 'Nursing' | 'Surgery' | 'Consumable' | 'Equipment' | 'Other';
    quantity: number;
    unit?: string;
    mrp?: number;
    unitPrice: number;
    discount?: number;
    totalBilled: number;
}

export interface AIExtractedBill {
    hospitalName: string;
    hospitalAddress?: string;
    gstin?: string;
    patientName?: string;
    patientId?: string;
    billDate: string;
    billNumber?: string;
    items: AIExtractedBillItem[];
    subtotal?: number;
    discount?: number;
    cgst?: number;
    sgst?: number;
    totalAmount: number;
    isMedicalBill: boolean;
    confidence: number;
    validationMessage?: string;
}

const TEXT_PARSING_PROMPT = `You are a medical bill text parser. Your ONLY job is to extract PURCHASED ITEMS from OCR text.

CRITICAL RULES:
1. **ONLY extract items from the ITEMIZED TABLE** (columns like S.No, Description, Qty, Price, Amount)
2. **IGNORE ALL METADATA**: phone numbers, addresses, GST numbers, invoice numbers, dates, patient names
3. **IGNORE SUMMARY ROWS**: subtotal, tax rows (CGST, SGST), grand total
4. **Each billable item** must have:
   - itemName: Medicine/service name with dosage
   - category: Medicine, Test, Consultation, Room, etc.
   - quantity: Number of units
   - unitPrice: Price per unit (after discount if applied)
   - totalBilled: Total for this item

WHAT TO EXTRACT (Billable Items Only):
✓ Medicines (e.g., "Oxyfloxin 100mg TAB", "Paracetamol 500mg")
✓ Medical tests (e.g., "Blood Test", "X-Ray", "MRI")
✓ Procedures/Services (e.g., "Consultation", "Room Charge")
✓ Medical equipment/consumables used

WHAT TO IGNORE (Metadata):
✗ Hospital/pharmacy name and address
✗ Phone numbers (10-digit numbers)
✗ Bill/Invoice numbers
✗ GST/Tax ID numbers
✗ Patient details (name, ID, age, gender)
✗ Dates and times
✗ Tax rows (CGST, SGST as line items)
✗ Subtotal/Grand Total/Balance rows
✗ Payment method info

PRICE DETECTION:
- Valid prices: 2-5 digit numbers (10, 100, 1500, 25000)
- NOT prices: 10-digit phone numbers (9876543210)
- NOT prices: GST numbers (alphanumeric)
- NOT prices: Bill numbers (usually < 10000)

Return ONLY this JSON:
{
  \"hospitalName\": \"name from header\",
  \"billDate\": \"YYYY-MM-DD\",
  \"patientName\": \"name or null\",
  \"billNumber\": \"number or null\",
  \"gstin\": \"GST number or null\",
  \"items\": [
    {
      \"itemName\": \"Full medicine/test name with dosage\",
      \"category\": \"Medicine|Test|Consultation|Room|Surgery|Nursing|Consumable|Equipment|Other\",
      \"quantity\": number,
      \"unit\": \"TAB|ML|MG|STRIP|etc\",
      \"mrp\": number (before discount),
      \"unitPrice\": number (actual charged),
      \"discount\": number (percentage),
      \"totalBilled\": number
    }
  ],
  \"subtotal\": number,
  \"cgst\": number,
  \"sgst\": number,
  \"totalAmount\": number,
  \"isMedicalBill\": true,
  \"confidence\": 0-100
}

EXAMPLE TEXT:
\"\"\"
Mediwell Pharmacy
Phone: 9876543210
GST: 06AAKFM9421M120
Bill No: 2304
Date: 24/12/2024

S.No  Description              Qty  MRP   Disc%  Price   Amount
1     OXYFLOXIN-100 TAB       1    320   22%    249.60  249.60
2     PARACETAMOL-500 MG TAB  1    13    26%    9.62    9.62

Subtotal: 259.22
CGST (2.5%): 6.48
SGST (2.5%): 6.48
Grand Total: 272.00
\"\"\"

CORRECT extraction (ONLY 2 items):
{
  \"hospitalName\": \"Mediwell Pharmacy\",
  \"billDate\": \"2024-12-24\",
  \"billNumber\": \"2304\",
  \"gstin\": \"06AAKFM9421M120\",
  \"items\": [
    {
      \"itemName\": \"OXYFLOXIN-100 TAB\",
      \"category\": \"Medicine\",
      \"quantity\": 1,
      \"unit\": \"TAB\",
      \"mrp\": 320,
      \"unitPrice\": 249.60,
      \"discount\": 22,
      \"totalBilled\": 249.60
    },
    {
      \"itemName\": \"PARACETAMOL-500 MG TAB\",
      \"category\": \"Medicine\",
      \"quantity\": 1,
      \"unit\": \"TAB\",
      \"mrp\": 13,
      \"unitPrice\": 9.62,
      \"discount\": 26,
      \"totalBilled\": 9.62
    }
  ],
  \"subtotal\": 259.22,
  \"cgst\": 6.48,
  \"sgst\": 6.48,
  \"totalAmount\": 272.00,
  \"isMedicalBill\": true,
  \"confidence\": 95
}

Now parse this OCR text:
`;

/**
 * Parse OCR text using Gemini AI for intelligent extraction
 */
export async function parseTextWithGemini(ocrText: string): Promise<AIExtractedBill | null> {
    const client = getGeminiClient();
    if (!client) {
        console.warn('Gemini API key not configured');
        return null;
    }

    try {
        console.log('Parsing OCR text with Gemini...');
        console.log('Text length:', ocrText.length);

        // Use current Gemini model for processing
        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const result = await model.generateContent(TEXT_PARSING_PROMPT + ocrText);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini text response:', text.substring(0, 500));

        // Extract JSON
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        } else {
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonStr = text.substring(jsonStart, jsonEnd + 1);
            }
        }

        const parsed = JSON.parse(jsonStr) as AIExtractedBill;
        console.log('Parsed from text, items:', parsed.items?.length || 0);

        // Validate fields
        return validateAndFixBill(parsed);
    } catch (error: any) {
        console.error('Gemini text parsing error:', error.message);
        return null;
    }
}

/**
 * Parse a bill image using Gemini Vision
 */
export async function parseWithGeminiAI(
    imageBuffer: Buffer,
    mimeType: string
): Promise<AIExtractedBill | null> {
    const client = getGeminiClient();
    if (!client) {
        console.warn('Gemini API key not configured');
        return null;
    }

    try {
        console.log('Starting Gemini Vision parsing...');

        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        const base64Image = imageBuffer.toString('base64');

        const prompt = `You are a medical bill parser. Your ONLY job is to extract PURCHASED ITEMS from the bill.

CRITICAL RULES:
1. **ONLY extract items from the ITEMIZED TABLE** (the section with columns like S.No, Description, Qty, Price, Amount)
2. **IGNORE ALL METADATA**: phone numbers, addresses, GST numbers, invoice numbers, dates, patient names
3. **IGNORE SUMMARY ROWS**: subtotal, tax rows (CGST, SGST, IGST), grand total, discount summary rows
4. **Each billable item** must have:
   - itemName: Medicine/service name with dosage (e.g., "Paracetamol 500mg")
   - category: Classify as "Medicine", "Test", "Consultation", "Room", etc.
   - quantity: Number of units purchased
   - unitPrice: Price per unit (use discounted price if discount is applied)
   - totalBilled: Total amount for this line item

WHAT TO EXTRACT (Billable Items Only):
✓ Medicines (e.g., "Oxyfloxin 100mg", "Paracetamol 500mg")
✓ Medical tests (e.g., "Blood Test", "X-Ray", "MRI")  
✓ Procedures/Services (e.g., "Consultation Fee", "Room Charge", "Nursing Charge")
✓ Medical equipment/consumables used in treatment

WHAT TO IGNORE (Metadata - NOT billable items):
✗ Hospital/pharmacy/clinic name and address
✗ Phone numbers (usually 10-digit numbers like 9876543210)
✗ Bill/Invoice numbers (e.g., "Bill No: 2304")
✗ GST/Tax ID numbers (e.g., "06AAKFM9421M120")
✗ Email addresses and websites
✗ Patient name, ID, age, gender
✗ Bill date and time
✗ Tax amount rows (CGST, SGST, IGST as separate line items)
✗ Subtotal, Grand Total, Amount Paid, Balance rows
✗ Discount percentage summary (unless it's part of item row)
✗ Payment method info (Cash, Card, UPI)

VISUAL TABLE RECOGNITION:
- The items table has NO GRID LINES, only whitespace alignment
- Large gaps between text = new column
- Look for repeating row structure: [Number] [Item Name] [Quantity] [Price] [Amount]
- Serial numbers (1, 2, 3...) usually mark the start of each item row
- Columns are vertically aligned even without lines

Return ONLY this JSON structure:
{
  "hospitalName": "Extract hospital/pharmacy name from header",
  "billDate": "YYYY-MM-DD format",
  "patientName": "Extract if clearly visible, else null",
  "billNumber": "Extract if visible, else null",
  "gstin": "Extract GST number if visible, else null",
  "items": [
    {
      "itemName": "Full medicine/test name with dosage",
      "category": "Medicine|Test|Consultation|Room|Surgery|Nursing|Consumable|Equipment|Other",
      "quantity": number,
      "unit": "TAB|ML|MG|STRIP|etc (if mentioned)",
      "mrp": number (maximum retail price before discount, if shown),
      "unitPrice": number (actual charged price per unit),
      "discount": number (discount percentage if shown),
      "totalBilled": number (total for this line item)
    }
  ],
  "subtotal": number (sum of items before tax),
  "cgst": number (central GST amount, not percentage),
  "sgst": number (state GST amount, not percentage),
  "totalAmount": number (final grand total),
  "isMedicalBill": true,
  "confidence": 0-100 (your confidence in extraction accuracy)
}

EXAMPLE:
For a pharmacy bill showing:
-------------------------------------
Mediwell Pharmacy
GST: 06AAKFM9421M120
Bill No: 2304
Date: 24/12/2024

S.No | Description              | Qty | MRP  | Disc% | Price  | Amount
1    | OXYFLOXIN-100 TAB       | 1   | 320  | 22%   | 249.60 | 249.60
2    | PARACETAMOL-500 MG TAB  | 1   | 13   | 26%   | 9.62   | 9.62

Subtotal: 259.22
CGST (2.5%): 6.48
SGST (2.5%): 6.48
Grand Total: 272.00
-------------------------------------

Correct extraction (ONLY 2 items):
{
  "hospitalName": "Mediwell Pharmacy",
  "billDate": "2024-12-24",
  "billNumber": "2304",
  "gstin": "06AAKFM9421M120",
  "items": [
    {
      "itemName": "OXYFLOXIN-100 TAB",
      "category": "Medicine",
      "quantity": 1,
      "unit": "TAB",
      "mrp": 320,
      "unitPrice": 249.60,
      "discount": 22,
      "totalBilled": 249.60
    },
    {
      "itemName": "PARACETAMOL-500 MG TAB",
      "category": "Medicine",
      "quantity": 1,
      "unit": "TAB",
      "mrp": 13,
      "unitPrice": 9.62,
      "discount": 26,
      "totalBilled": 9.62
    }
  ],
  "subtotal": 259.22,
  "cgst": 6.48,
  "sgst": 6.48,
  "totalAmount": 272.00,
  "isMedicalBill": true,
  "confidence": 95
}

WRONG extraction (includes metadata as items):
{
  "items": [
    {"itemName": "Bill No 2304", ...},  // ✗ WRONG - this is metadata
    {"itemName": "Phone: 9876543210", ...},  // ✗ WRONG - this is contact info
    {"itemName": "Subtotal", ...},  // ✗ WRONG - this is summary
    {"itemName": "OXYFLOXIN-100", ...},  // ✓ CORRECT
    ...
  ]
}

Now analyze this medical bill image and extract ONLY the billable items:`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { mimeType, data: base64Image } }
        ]);

        const response = await result.response;
        const text = response.text();
        console.log('Gemini vision response:', text.substring(0, 500));

        // Extract JSON
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        } else {
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonStr = text.substring(jsonStart, jsonEnd + 1);
            }
        }

        const parsed = JSON.parse(jsonStr) as AIExtractedBill;
        console.log('Parsed from image, items:', parsed.items?.length || 0);

        return validateAndFixBill(parsed);
    } catch (error: any) {
        console.error('Gemini Vision error:', error.message);
        return null;
    }
}

function validateAndFixBill(parsed: AIExtractedBill): AIExtractedBill {
    if (!parsed.items || !Array.isArray(parsed.items)) {
        parsed.items = [];
    }

    if (!parsed.hospitalName) {
        parsed.hospitalName = 'Unknown Hospital';
    }

    if (!parsed.billDate) {
        parsed.billDate = new Date().toISOString().split('T')[0];
    }

    if (typeof parsed.totalAmount !== 'number') {
        parsed.totalAmount = parsed.items.reduce((sum, item) => sum + (item.totalBilled || 0), 0);
    }

    if (typeof parsed.confidence !== 'number') {
        parsed.confidence = 85;
    }

    if (typeof parsed.isMedicalBill !== 'boolean') {
        parsed.isMedicalBill = true;
    }

    // Fix items
    parsed.items = parsed.items.map(item => ({
        itemName: item.itemName || 'Unknown Item',
        category: item.category || 'Other',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.totalBilled || 0,
        totalBilled: item.totalBilled || item.unitPrice || 0,
        mrp: item.mrp,
        unit: item.unit,
        discount: item.discount,
    }));

    // CRITICAL: Filter out metadata that was mistakenly extracted as items
    parsed.items = parsed.items.filter(item => {
        const name = item.itemName.toLowerCase().trim();

        // Reject if item name is too short (likely incomplete extraction)
        if (name.length < 3) {
            console.log(`Filtered out item (too short): "${item.itemName}"`);
            return false;
        }

        // Reject items that look like metadata
        const metadataKeywords = [
            'invoice', 'bill no', 'bill number', 'receipt',
            'gst', 'gstin', 'tax id', 'pan',
            'phone', 'mobile', 'tel', 'contact',
            'email', 'website', 'www',
            'address', 'street', 'city', 'pincode', 'pin code',
            'patient id', 'patient no', 'uhid',
            'subtotal', 'sub-total', 'sub total',
            'grand total', 'net amount', 'balance',
            'amount paid', 'paid by', 'payment mode',
            'cash', 'card', 'upi', 'online',
            'cgst', 'sgst', 'igst', 'tax amount',
            'discount total', 'total discount',
            'signature', 'authorized', 'terms',
            'thank you', 'visit again'
        ];

        const hasMetadataKeyword = metadataKeywords.some(keyword => name.includes(keyword));
        if (hasMetadataKeyword) {
            console.log(`Filtered out item (metadata keyword): "${item.itemName}"`);
            return false;
        }

        // Reject items that are just numbers (like phone numbers or bill numbers)
        const isJustNumbers = /^[\d\s\-\(\)]+$/.test(name);
        if (isJustNumbers) {
            console.log(`Filtered out item (just numbers): "${item.itemName}"`);
            return false;
        }

        // Reject items with 10-digit phone number patterns
        const hasPhoneNumber = /\d{10}/.test(name) || /\d{3}[-\s]?\d{3}[-\s]?\d{4}/.test(name);
        if (hasPhoneNumber) {
            console.log(`Filtered out item (phone pattern): "${item.itemName}"`);
            return false;
        }

        // Reject items with GST number pattern (15 characters: 2 digits + 10 alphanumeric + 1 letter + 1 digit + 1 letter)
        const hasGSTPattern = /\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]/.test(name.toUpperCase());
        if (hasGSTPattern) {
            console.log(`Filtered out item (GST pattern): "${item.itemName}"`);
            return false;
        }

        // Reject items with suspiciously high unit prices (> ₹100,000)
        // This catches cases where phone numbers were mistaken for prices
        if (item.unitPrice > 100000) {
            console.log(`Filtered out item (suspicious price): "${item.itemName}" (₹${item.unitPrice})`);
            return false;
        }

        // Reject items with zero or negative prices (except if it's a discount item)
        if (item.unitPrice <= 0 && !name.includes('discount')) {
            console.log(`Filtered out item (zero/negative price): "${item.itemName}" (₹${item.unitPrice})`);
            return false;
        }

        // Item passed all filters
        return true;
    });

    console.log(`Validation complete: ${parsed.items.length} valid items after filtering`);

    return parsed;
}

/**
 * Check if Gemini API is available
 */
export function isGeminiAvailable(): boolean {
    return !!getGeminiClient();
}
