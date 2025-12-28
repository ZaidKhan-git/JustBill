/**
 * Bill Validator Service
 * 
 * Validates if an OCR-extracted document is a medical/hospital bill
 * by checking for characteristic keywords and patterns.
 */

export interface ValidationResult {
    isMedicalBill: boolean;
    confidence: number; // 0-100
    detectedKeywords: string[];
    reason?: string;
}

// Keywords strongly indicating a medical bill
const MEDICAL_KEYWORDS = [
    // Hospital/clinic identifiers
    'hospital', 'clinic', 'medical', 'healthcare', 'health centre', 'nursing home',
    'diagnostic', 'pathology', 'laboratory', 'lab report',

    // Document type indicators
    'patient', 'admission', 'discharge', 'opd', 'ipd', 'inpatient', 'outpatient',
    'prescription', 'diagnosis', 'treatment', 'consultation',

    // Billing terms
    'bill', 'invoice', 'receipt', 'charges', 'pharmacy', 'medicine', 'drug',

    // Medical terms
    'doctor', 'dr.', 'physician', 'surgeon', 'specialist', 'nursing',
    'ward', 'icu', 'ot', 'operation theatre', 'emergency',

    // Tests and procedures
    'x-ray', 'xray', 'mri', 'ct scan', 'ultrasound', 'usg', 'ecg', 'ekg',
    'blood test', 'urine test', 'biopsy', 'cbc', 'hemoglobin',

    // Medications (common patterns)
    'tablet', 'capsule', 'injection', 'syrup', 'mg', 'ml', 'saline', 'iv',

    // Registration/regulatory
    'uhid', 'mr no', 'reg no', 'registration', 'nabh', 'nabl',
];

// Keywords that suggest it's NOT a medical bill
const NON_MEDICAL_KEYWORDS = [
    // Retail/shopping
    'grocery', 'supermarket', 'mart', 'store', 'retail', 'shopping',
    'burger', 'pizza', 'coffee', 'restaurant', 'food', 'beverage',

    // Utilities
    'electricity', 'water bill', 'gas bill', 'internet', 'mobile', 'telecom',
    'broadband', 'dth', 'cable',

    // Transport
    'petrol', 'diesel', 'fuel', 'airline', 'flight', 'railway', 'bus ticket',
    'uber', 'ola', 'cab', 'taxi',

    // Banking/financial
    'bank statement', 'credit card', 'loan', 'emi', 'insurance premium',

    // E-commerce
    'amazon', 'flipkart', 'myntra', 'order id', 'tracking', 'delivery',

    // Construction/services
    'rent', 'maintenance', 'repair', 'plumber', 'electrician',
];

/**
 * Validate if the OCR text is from a medical bill
 */
export function validateMedicalBill(ocrText: string): ValidationResult {
    const lowerText = ocrText.toLowerCase();

    // Count medical keywords found
    const detectedMedical: string[] = [];
    for (const keyword of MEDICAL_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            detectedMedical.push(keyword);
        }
    }

    // Count non-medical keywords found
    const detectedNonMedical: string[] = [];
    for (const keyword of NON_MEDICAL_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            detectedNonMedical.push(keyword);
        }
    }

    // Calculate confidence score
    const medicalScore = detectedMedical.length;
    const nonMedicalScore = detectedNonMedical.length * 2; // Weight non-medical higher

    // Decision logic
    let isMedicalBill = false;
    let confidence = 0;
    let reason: string | undefined;

    if (medicalScore === 0 && nonMedicalScore === 0) {
        // No clear indicators - check for any numbers/amounts pattern
        const hasAmounts = /₹\s*\d+|\brs\.?\s*\d+|\d+\.\d{2}/i.test(ocrText);
        if (hasAmounts) {
            isMedicalBill = false;
            confidence = 30;
            reason = 'Could not identify this as a medical bill. No medical-related terms found.';
        } else {
            isMedicalBill = false;
            confidence = 10;
            reason = 'Unable to recognize document type. Please upload a clear hospital bill.';
        }
    } else if (medicalScore >= 3 && nonMedicalScore <= 1) {
        // Strong medical indicators
        isMedicalBill = true;
        confidence = Math.min(95, 50 + medicalScore * 5);
        reason = undefined;
    } else if (medicalScore >= 1 && nonMedicalScore === 0) {
        // Some medical indicators, no contradictions
        isMedicalBill = true;
        confidence = Math.min(80, 40 + medicalScore * 10);
        reason = undefined;
    } else if (nonMedicalScore > medicalScore) {
        // More non-medical than medical
        isMedicalBill = false;
        confidence = Math.min(90, 50 + nonMedicalScore * 10);
        reason = `This appears to be a ${detectedNonMedical[0]} receipt, not a medical bill.`;
    } else {
        // Mixed signals - lean towards medical if at least some indicators
        isMedicalBill = medicalScore >= 2;
        confidence = 50;
        reason = isMedicalBill ? undefined : 'Unable to confirm this is a medical bill.';
    }

    return {
        isMedicalBill,
        confidence,
        detectedKeywords: detectedMedical,
        reason,
    };
}
