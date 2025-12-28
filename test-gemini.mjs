// Test with different Gemini models to find one that works
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('GEMINI_API_KEY:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT SET');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try models in order of preference
    const modelsToTry = [
        'gemini-2.0-flash-lite',
        'gemini-2.5-flash-lite',
        'gemini-flash-latest',
        'gemini-flash-lite-latest',
    ];

    // Read bill image
    const billPath = path.join(__dirname, 'bill.webp');
    const billBuffer = fs.readFileSync(billPath);
    const base64Image = billBuffer.toString('base64');

    console.log('Image size:', billBuffer.length, 'bytes');

    const prompt = `Analyze this medical bill image. Extract ONLY the medicines/items and their amounts.

Return as JSON:
{
  "hospitalName": "name of hospital/pharmacy",
  "items": [
    {"name": "medicine/item name", "quantity": 1, "amount": 123.45}
  ],
  "totalAmount": 999.99
}`;

    for (const modelName of modelsToTry) {
        console.log(`\nTrying: ${modelName}...`);

        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([
                prompt,
                { inlineData: { mimeType: 'image/webp', data: base64Image } }
            ]);

            const response = await result.response;
            const text = response.text();

            console.log('SUCCESS!');
            console.log('\n===== RESPONSE =====');
            console.log(text);
            return modelName;

        } catch (error) {
            if (error.message.includes('429')) {
                console.log('Rate limited');
            } else if (error.message.includes('404')) {
                console.log('Model not found');
            } else {
                console.log('Error:', error.message.substring(0, 80));
            }
        }
    }

    console.log('\nAll models failed or rate limited.');
    return null;
}

testGemini();
