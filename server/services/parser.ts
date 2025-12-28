/**
 * Bill Parser Service
 * 
 * Parses OCR text from Indian hospital bills to extract structured data.
 * Follows BIS IS-19493:2025 bill format guidelines.
 */

export interface ParsedBillItem {
    rawText: string;
    itemName: string;
    category: string;
    quantity: number;
    unit?: string;
    mrp?: number;
    unitPrice?: number;
    discount?: number;
    totalBilled: number;
}

export interface ParsedBill {
    hospitalName?: string;
    hospitalAddress?: string;
    gstin?: string;
    patientName?: string;
    patientId?: string;
    billDate?: Date;
    billNumber?: string;
    admissionDate?: Date;
    dischargeDate?: Date;
    items: ParsedBillItem[];
    grossTotal?: number;
    discount?: number;
    cgst?: number;
    sgst?: number;
    netPayable?: number;
}

// Category keywords to identify item types
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    Medicine: ['pharmacy', 'medicine', 'drug', 'tablet', 'tab', 'capsule', 'cap', 'injection', 'inj', 'syrup', 'drops', 'ointment', 'gel', 'cream', 'saline', 'dextrose', 'ringer', 'paracetamol', 'amoxicillin', 'omeprazole'],
    Test: ['laboratory', 'lab', 'test', 'investigation', 'pathology', 'radiology', 'x-ray', 'xray', 'ct scan', 'mri', 'ultrasound', 'usg', 'echo', 'ecg', 'ekg', 'blood', 'cbc', 'lipid', 'liver', 'kidney', 'thyroid'],
    Room: ['room', 'bed', 'ward', 'icu', 'nicu', 'picu', 'general ward', 'semi-private', 'private', 'deluxe', 'suite'],
    Consultation: ['consultation', 'consult', 'visit', 'opd', 'doctor fee', 'physician', 'specialist'],
    Nursing: ['nursing', 'nurse', 'attendant'],
    Surgery: ['surgery', 'operation', 'ot charges', 'theatre', 'anesthesia', 'anaesthesia', 'procedure'],
    Consumable: ['consumable', 'disposable', 'syringe', 'cannula', 'catheter', 'gloves', 'mask', 'gown', 'cotton', 'bandage', 'dressing', 'iv cannula'],
    Equipment: ['equipment', 'ventilator', 'monitor', 'oxygen', 'nebulizer'],
};

export function parseBillText(ocrText: string): ParsedBill {
    const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const result: ParsedBill = { items: [] };

    // Extract hospital name (usually first non-empty line in uppercase)
    for (const line of lines.slice(0, 5)) {
        if (line.length > 5 && line === line.toUpperCase() && !/\d{2}[\/\-]\d{2}/.test(line)) {
            result.hospitalName = titleCase(line);
            break;
        }
    }

    // Extract GSTIN
    const gstinMatch = ocrText.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1})\b/i);
    if (gstinMatch) {
        result.gstin = gstinMatch[1];
    }

    // Extract dates - DD/MM/YYYY or DD-MM-YYYY
    const dateMatches = ocrText.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || [];
    if (dateMatches.length > 0) {
        result.billDate = parseIndianDate(dateMatches[dateMatches.length - 1]);
    }

    // Extract bill number
    const billNoMatch = ocrText.match(/(?:bill|invoice|inv)[\s\.#:\-no]*([A-Z0-9\-]+)/i);
    if (billNoMatch) {
        result.billNumber = billNoMatch[1];
    }

    // Extract line items
    let currentCategory = 'Other';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // Check if this is a category header
        if (isCategoryHeader(lowerLine)) {
            currentCategory = detectCategory(lowerLine) || currentCategory;
            continue;
        }

        // Try to parse as a line item
        const item = parseLineItem(line, currentCategory);
        if (item) {
            result.items.push(item);
        }
    }

    // Extract totals
    const grossMatch = ocrText.match(/(?:gross|sub)\s*total[\s:₹Rs\.]*([0-9,]+\.?\d*)/i);
    if (grossMatch) {
        result.grossTotal = parseFloat(grossMatch[1].replace(/,/g, ''));
    }

    const netMatch = ocrText.match(/(?:net|grand|final)\s*(?:total|payable|amount)[\s:₹Rs\.]*([0-9,]+\.?\d*)/i);
    if (netMatch) {
        result.netPayable = parseFloat(netMatch[1].replace(/,/g, ''));
    }

    // Extract discount
    const discountMatch = ocrText.match(/discount[\s:\-₹Rs\.]*([0-9,]+\.?\d*)/i);
    if (discountMatch) {
        result.discount = parseFloat(discountMatch[1].replace(/,/g, ''));
    }

    // Extract GST
    const cgstMatch = ocrText.match(/cgst[\s\(\d%\)\:₹Rs\.]*([0-9,]+\.?\d*)/i);
    if (cgstMatch) {
        result.cgst = parseFloat(cgstMatch[1].replace(/,/g, ''));
    }

    const sgstMatch = ocrText.match(/sgst[\s\(\d%\)\:₹Rs\.]*([0-9,]+\.?\d*)/i);
    if (sgstMatch) {
        result.sgst = parseFloat(sgstMatch[1].replace(/,/g, ''));
    }

    return result;
}

function isCategoryHeader(text: string): boolean {
    const headers = ['pharmacy', 'laboratory', 'room charges', 'consultation', 'nursing', 'consumables', 'equipment', 'medicines'];
    return headers.some(h => text.includes(h)) && !text.match(/\d+\.\d{2}/);
}

function detectCategory(text: string): string | null {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return category;
            }
        }
    }
    return null;
}

function parseLineItem(line: string, defaultCategory: string): ParsedBillItem | null {
    const lowerLine = line.toLowerCase();

    // Skip non-item lines - EXPANDED LIST
    const skipPatterns = [
        /^total/i, /^net/i, /^gross/i, /^discount/i, /^cgst/i, /^sgst/i, /^igst/i,
        /^payment/i, /^receipt/i, /^phone/i, /^address/i, /^gstin/i,
        /^patient/i, /^name/i, /^date/i, /^bill\s*(no|number)?/i,
        /^subtotal/i, /^payable/i, /^invoice/i, /^gst/i,
        // Address patterns
        /h\s*no\.?/i, /house\s*no/i, /block/i, /sector/i, /street/i,
        /delhi/i, /mumbai/i, /bangalore/i, /kolkata/i, /chennai/i, /hyderabad/i,
        /india/i, /pincode/i, /pin\s*code/i,
        // Demographic/personal info
        /male|female|gender|age|dob|birth/i,
        /aadhar|pan\s*no|uid/i,
        // Contact patterns  
        /email|phone|mobile|tel|fax/i, /\d{10}/,  // 10-digit numbers (phone)
        // Document metadata
        /admit|discharge|visit|consultation\s*date/i,
        /doctor|physician|surgeon/i,
        // Summary keywords
        /remarks|notes|thank\s*you|signature/i,
        /terms|conditions|policy/i,
    ];

    if (skipPatterns.some(p => p.test(line.trim()))) {
        return null;
    }

    // Skip lines that look like coordinates or addresses with colons
    if (/^:\s*[A-Za-z]+\//.test(line) || /^:\s*H\s*No/i.test(line)) {
        return null;
    }

    // Skip lines with URLs or email patterns
    if (/www\.|http|\.com|@/.test(line)) {
        return null;
    }

    // Line must have at least one number that looks like money
    const amountPattern = /(\d+(?:,\d{3})*(?:\.\d{1,2})?)/g;
    const amounts = line.match(amountPattern);

    if (!amounts || amounts.length === 0) {
        return null;
    }

    // Parse numeric values
    const numericAmounts = amounts.map(a => parseFloat(a.replace(/,/g, ''))).filter(n => n > 0);

    if (numericAmounts.length === 0) {
        return null;
    }

    // Filter out suspiciously high amounts (likely phone numbers or coordinates)
    // Medical bills rarely have individual items > ₹1 lakh
    if (numericAmounts.some(n => n > 100000)) {
        // Check if this looks like a valid expensive medical item
        const hasValidMedicalContext = /surgery|operation|transplant|implant|icu|ventilator|dialysis/i.test(line);
        if (!hasValidMedicalContext) {
            return null;  // Probably a phone number or garbage
        }
    }

    // Extract quantity (look for Qty: X, x10, 10 nos, etc.)
    let quantity = 1;
    const qtyMatch = line.match(/(?:qty|quantity)?[\s:]*(\d+)\s*(?:nos?|units?|pcs?|×|x(?!\.))/i);
    if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10);
    }

    // Extract MRP
    let mrp: number | undefined;
    const mrpMatch = line.match(/(?:mrp|m\.r\.p\.?)[\s:₹Rs\.]*(\d+(?:\.\d{2})?)/i);
    if (mrpMatch) {
        mrp = parseFloat(mrpMatch[1]);
    }

    // Clean item name - remove numbers and markers
    let itemName = line
        .replace(/^\d+\.\s*/, '') // Remove leading \"1. \"
        .replace(/(?:qty|quantity)?[\s:]*\d+\s*(?:nos?|units?|pcs?)?/gi, '')
        .replace(/(?:mrp|m\.r\.p\.?)[\s:₹Rs\.]*\d+(?:\.\d{2})?/gi, '')
        .replace(/(?:total|sub-?total)?[\s:₹Rs\.]*\d+(?:,\d{3})*(?:\.\d{2})?/gi, '')
        .replace(/₹\s*\d+(?:,\d{3})*(?:\.\d{2})?/g, '')
        .replace(/\d+(?:,\d{3})*\.\d{2}/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Remove trailing numbers (prices)
    itemName = itemName.replace(/\s+\d+(?:\.\d+)?$/, '').trim();

    // Remove leading colons and clean up
    itemName = itemName.replace(/^:\s*/, '').trim();

    if (itemName.length < 3) {
        return null;
    }

    // Additional validation: Reject if item name contains only special characters and slashes
    if (/^[^a-zA-Z0-9]+$/.test(itemName) || /\/\/\//.test(itemName)) {
        return null;
    }

    // Reject if item name is mostly non-alphanumeric
    const alphanumericRatio = (itemName.match(/[a-zA-Z0-9]/g) || []).length / itemName.length;
    if (alphanumericRatio < 0.5) {
        return null;
    }

    // Detect category from item content
    const category = detectCategory(lowerLine) || defaultCategory;

    // Get the total (usually the last and largest number)
    let totalBilled = numericAmounts[numericAmounts.length - 1];

    // If we have multiple amounts, try to identify unit price vs total
    let unitPrice = mrp || totalBilled / quantity;
    if (numericAmounts.length >= 2) {
        // Common pattern: Qty, UnitPrice, Total
        // Or: UnitPrice, Total
        if (numericAmounts.length >= 3 && numericAmounts[0] === quantity) {
            unitPrice = numericAmounts[1];
            totalBilled = numericAmounts[2];
        } else if (numericAmounts[numericAmounts.length - 1] > numericAmounts[numericAmounts.length - 2]) {
            unitPrice = numericAmounts[numericAmounts.length - 2];
        }
    }

    return {
        rawText: line,
        itemName: titleCase(itemName),
        category,
        quantity,
        mrp,
        unitPrice,
        totalBilled,
    };
}

function parseIndianDate(dateStr: string): Date | undefined {
    const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (!match) return undefined;

    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);

    // Handle 2-digit years
    if (year < 100) {
        year += 2000;
    }

    // Validate
    if (day > 31 || month > 12) {
        [day, month] = [month, day];
    }

    return new Date(year, month - 1, day);
}

function titleCase(str: string): string {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
