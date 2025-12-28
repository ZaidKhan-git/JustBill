/**
 * OCR Service using OCR.space Free API
 * 
 * Why OCR.space:
 * - Free tier: 500 requests/day (sufficient for MVP)
 * - Cloud API (no installation required)
 * - Returns structured JSON with text positions
 * - Supports image and PDF
 */

interface OcrResult {
    success: boolean;
    text: string;
    confidence: number;
    error?: string;
}

interface OcrSpaceResponse {
    ParsedResults?: Array<{
        ParsedText: string;
        ErrorMessage?: string;
        FileParseExitCode: number;
    }>;
    IsErroredOnProcessing: boolean;
    ErrorMessage?: string[];
    OCRExitCode: number;
}

// For development/demo, use a fallback mock when API key is not set
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'helloworld'; // 'helloworld' is OCR.space's free demo key

export async function performOcr(imageBuffer: Buffer, filename: string): Promise<OcrResult> {
    try {
        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');
        const mimeType = getMimeType(filename);
        const base64Data = `data:${mimeType};base64,${base64Image}`;

        // Call OCR.space API
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
                'apikey': OCR_SPACE_API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                base64Image: base64Data,
                language: 'eng',
                isOverlayRequired: 'false',
                detectOrientation: 'true',
                scale: 'true',
                OCREngine: '2', // Engine 2 is better for receipts/bills
            }),
        });

        if (!response.ok) {
            throw new Error(`OCR API returned ${response.status}`);
        }

        const data: OcrSpaceResponse = await response.json();

        if (data.IsErroredOnProcessing || data.OCRExitCode !== 1) {
            return {
                success: false,
                text: '',
                confidence: 0,
                error: data.ErrorMessage?.join(', ') || 'OCR processing failed',
            };
        }

        const parsedResult = data.ParsedResults?.[0];
        if (!parsedResult || parsedResult.FileParseExitCode !== 1) {
            return {
                success: false,
                text: '',
                confidence: 0,
                error: parsedResult?.ErrorMessage || 'Failed to parse image',
            };
        }

        return {
            success: true,
            text: parsedResult.ParsedText,
            confidence: 85, // OCR.space doesn't return confidence, estimate based on engine
        };
    } catch (error) {
        console.error('OCR Error:', error);
        return {
            success: false,
            text: '',
            confidence: 0,
            error: error instanceof Error ? error.message : 'Unknown OCR error',
        };
    }
}

function getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'pdf': return 'application/pdf';
        case 'webp': return 'image/webp';
        default: return 'image/jpeg';
    }
}

// For testing without API calls
export function mockOcrResult(): OcrResult {
    return {
        success: true,
        confidence: 90,
        text: `
CITY GENERAL HOSPITAL
123 Medical Lane, Mumbai - 400001
GSTIN: 27AABCU9603R1ZM
Phone: 022-12345678

PATIENT DETAILS
Name: John Doe
Age: 45 Years / Male
Patient ID: PID-2024-12345
Admission: 20/12/2024
Discharge: 23/12/2024

BILL DETAILS                           Bill No: INV-2024-98765
                                        Date: 23/12/2024

PHARMACY
1. Paracetamol 500mg Tab    Qty: 20    MRP: 3.00    Total: 60.00
2. Amoxicillin 500mg Cap    Qty: 15    MRP: 8.00    Total: 120.00
3. Omeprazole 20mg Cap      Qty: 10    MRP: 6.00    Total: 60.00
4. Normal Saline 500ml      Qty: 4     MRP: 45.00   Total: 180.00
                                    Pharmacy Total: 420.00

LABORATORY
5. Complete Blood Count (CBC)           Total: 350.00
6. Lipid Profile                        Total: 600.00
7. Liver Function Test                  Total: 700.00
8. X-Ray Chest PA View                  Total: 400.00
                                    Lab Total: 2050.00

ROOM CHARGES
9. Semi-Private Room (3 days × 3500)    Total: 10500.00

CONSULTATION
10. Specialist Consultation (2 visits)   Total: 1500.00

NURSING
11. Nursing Charges (3 days × 400)       Total: 1200.00

CONSUMABLES
12. IV Cannula                Qty: 2    Total: 150.00
13. Surgical Gloves           Qty: 10   Total: 400.00
14. Syringe 5ml              Qty: 6    Total: 90.00

                                    Gross Total: 16310.00
                                    Discount: -500.00
                                    CGST (9%): 715.45
                                    SGST (9%): 715.45
                                    
                                    NET PAYABLE: 17240.90

Payment Mode: Cash
Receipt No: REC-2024-45678
`,
    };
}
