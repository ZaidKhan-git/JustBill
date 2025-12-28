// Test script to call the API and see what Gemini/Mindee returns
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBillParsing() {
    const billPath = path.join(__dirname, 'bill.webp');

    if (!fs.existsSync(billPath)) {
        console.error('Bill file not found:', billPath);
        return;
    }

    console.log('Reading bill file...');
    const billBuffer = fs.readFileSync(billPath);

    // Create form data
    const formData = new FormData();
    formData.append('billImage', new Blob([billBuffer], { type: 'image/webp' }), 'bill.webp');
    formData.append('stateId', '32');

    console.log('Sending request to API...');

    try {
        const response = await fetch('http://127.0.0.1:5000/api/analyze', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        console.log('\n===== API RESPONSE =====');
        console.log('Status:', response.status);
        console.log('Parsing Method:', data.parsingMethod);
        console.log('OCR Confidence:', data.ocrConfidence);
        console.log('Hospital Name:', data.hospitalName);
        console.log('Bill Date:', data.billDate);
        console.log('Total Billed:', data.summary?.totalBilled);
        console.log('Item Count:', data.summary?.itemCount);
        console.log('\n===== ITEMS =====');
        if (data.items && data.items.length > 0) {
            data.items.forEach((item, i) => {
                console.log(`${i + 1}. ${item.itemName} | Category: ${item.category} | Qty: ${item.quantity} | Price: ${item.totalBilled}`);
            });
        } else {
            console.log('No items found');
        }

        // Write full response to file for debugging
        fs.writeFileSync('api_response.json', JSON.stringify(data, null, 2));
        console.log('\nFull response saved to api_response.json');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testBillParsing();
