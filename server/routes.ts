import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { performOcr, mockOcrResult } from "./services/ocr";
import { parseBillText, type ParsedBillItem } from "./services/parser";
import { comparePrices, calculateSummary, type GovtPriceEntry } from "./services/price-compare";
import { validateMedicalBill } from "./services/validator";
import { parseWithMindee, isMindeeAvailable } from "./services/mindee-parser";
import { parseWithGeminiAI, parseTextWithGemini, isGeminiAvailable } from "./services/ai-parser";
import { hashPassword, verifyPassword, isValidEmail, isValidPassword, requireAuth } from "./services/auth";
import { statesData, categoriesData } from "./seeds/states-categories";
import { govtPricesData } from "./seeds/govt-prices";

// In-memory data store (will be replaced with database in production)
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

interface BillAnalysis {
  id: string;
  userId: string;
  hospitalName?: string;
  billDate?: Date;
  uploadedAt: Date;
  stateId: number;
  totalBilled: number;
  totalFairPrice: number;
  overchargeAmount: number;
  itemCount: number;
  overchargedItemCount: number;
  status: string;
  items: any[];
}

const users: Map<string, User> = new Map();
const analyses: Map<string, BillAnalysis> = new Map();

// Build price database from seed data
const priceDatabase: GovtPriceEntry[] = govtPricesData.map((item, index) => {
  const category = categoriesData.find(c => c.name === item.category);
  return {
    id: index + 1,
    categoryId: category ? categoriesData.indexOf(category) + 1 : 10,
    categoryName: item.category,
    itemName: item.itemName,
    itemCode: item.itemCode,
    ceilingPrice: parseFloat(item.ceilingPrice),
    unit: item.unit,
    source: item.source,
    publishedDate: new Date(item.publishedDate),
  };
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.'));
    }
  },
});

// Simple session management (in production, use express-session with database store)
const sessions: Map<string, string> = new Map(); // sessionId -> userId

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Simple session middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.headers['x-session-id'] as string;
    if (sessionId && sessions.has(sessionId)) {
      const userId = sessions.get(sessionId)!;
      (req as any).user = users.get(userId);
      (req as any).isAuthenticated = () => true;
    } else {
      (req as any).isAuthenticated = () => false;
    }
    next();
  });

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================

  // Register
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Validate inputs
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const passwordCheck = isValidPassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.message });
      }

      // Check if user exists
      const existingUser = Array.from(users.values()).find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user: User = {
        id: generateId(),
        email,
        password: hashedPassword,
        name,
        createdAt: new Date(),
      };
      users.set(user.id, user);

      // Create session
      const sessionId = generateId();
      sessions.set(sessionId, user.id);

      res.json({
        user: { id: user.id, email: user.email, name: user.name },
        sessionId,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = Array.from(users.values()).find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const validPassword = await verifyPassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Create session
      const sessionId = generateId();
      sessions.set(sessionId, user.id);

      res.json({
        user: { id: user.id, email: user.email, name: user.name },
        sessionId,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ success: true });
  });

  // Get current user
  app.get('/api/auth/me', (req: Request, res: Response) => {
    if (!(req as any).isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = (req as any).user;
    res.json({ id: user.id, email: user.email, name: user.name });
  });

  // ============================================================================
  // STATES & REFERENCE DATA
  // ============================================================================

  // Get all states
  app.get('/api/states', (req: Request, res: Response) => {
    res.json(statesData.map((s, i) => ({ id: i + 1, ...s })));
  });

  // Get categories
  app.get('/api/categories', (req: Request, res: Response) => {
    res.json(categoriesData.map((c, i) => ({ id: i + 1, ...c })));
  });

  // Get reference data info (for transparency)
  app.get('/api/reference-info', (req: Request, res: Response) => {
    // Find latest published dates by source
    const sources = new Map<string, { count: number; latestDate: Date }>();

    for (const price of priceDatabase) {
      const source = price.source;
      const existing = sources.get(source);
      if (!existing || price.publishedDate > existing.latestDate) {
        sources.set(source, {
          count: (existing?.count || 0) + 1,
          latestDate: price.publishedDate,
        });
      } else if (existing) {
        existing.count++;
      }
    }

    res.json({
      sources: Array.from(sources.entries()).map(([name, data]) => ({
        name,
        itemCount: data.count,
        publishedDate: data.latestDate.toISOString().split('T')[0],
      })),
      totalItems: priceDatabase.length,
    });
  });

  // ============================================================================
  // BILL ANALYSIS
  // ============================================================================

  // Analyze bill (protected route)
  app.post('/api/analyze', upload.single('billImage'), async (req: Request, res: Response) => {
    try {
      // For demo, allow both authenticated and unauthenticated
      const user = (req as any).user;
      const stateId = parseInt(req.body.stateId) || 1;

      let parsedItems: ParsedBillItem[] = [];
      let hospitalName = 'Unknown Hospital';
      let billDate = new Date();
      let billNumber: string | undefined;
      let discount = 0;
      let cgst = 0;
      let sgst = 0;
      let ocrConfidence = 80;
      let isDemo = false;
      let parsingMethod = 'regex';

      if (req.file) {
        // PRIORITY 1: Try Mindee invoice parsing first if available
        if (isMindeeAvailable()) {
          console.log('🔍 [Parser] Trying Mindee Invoice API...');
          const mindeeResult = await parseWithMindee(req.file.buffer, req.file.originalname);

          if (mindeeResult && mindeeResult.items.length > 0) {
            parsingMethod = 'mindee';
            ocrConfidence = mindeeResult.confidence;

            // Use Mindee's extracted data
            hospitalName = mindeeResult.hospitalName;
            billDate = mindeeResult.billDate;
            billNumber = mindeeResult.billNumber;
            cgst = mindeeResult.totalTax / 2; // Split tax into CGST/SGST
            sgst = mindeeResult.totalTax / 2;
            parsedItems = mindeeResult.items;

            console.log(`✅ [Mindee] Success: ${parsedItems.length} items extracted`);
          } else {
            console.log('⚠️ [Mindee] Failed or returned 0 items');
          }
        }

        // PRIORITY 2: Try Gemini AI Vision if Mindee failed
        if (parsedItems.length === 0 && isGeminiAvailable()) {
          console.log('🤖 [Parser] Trying Gemini AI Vision...');
          const geminiResult = await parseWithGeminiAI(req.file.buffer, req.file.mimetype);

          if (geminiResult && geminiResult.items.length > 0) {
            parsingMethod = 'gemini-vision';
            ocrConfidence = geminiResult.confidence;

            // Convert AI result to ParsedBillItem format
            hospitalName = geminiResult.hospitalName;
            billDate = new Date(geminiResult.billDate);
            billNumber = geminiResult.billNumber;
            cgst = geminiResult.cgst || 0;
            sgst = geminiResult.sgst || 0;
            parsedItems = geminiResult.items.map(item => ({
              rawText: item.itemName,
              itemName: item.itemName,
              category: item.category,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalBilled: item.totalBilled,
            }));

            console.log(`✅ [Gemini Vision] Success: ${parsedItems.length} items extracted`);
          } else {
            console.log('⚠️ [Gemini Vision] Failed or returned 0 items');
          }
        }

        // PRIORITY 3: Fallback to OCR + regex parsing if Gemini also failed
        if (parsedItems.length === 0) {
          console.log('📄 [Parser] Trying OCR + Regex fallback...');
          const ocrResult = await performOcr(req.file.buffer, req.file.originalname);

          if (!ocrResult.success) {
            return res.status(400).json({
              error: 'ocr_failed',
              message: 'Could not read the uploaded image. Please try a clearer photo.',
            });
          }

          ocrConfidence = ocrResult.confidence;

          // Validate it's a medical bill
          const validation = validateMedicalBill(ocrResult.text);
          if (!validation.isMedicalBill) {
            return res.status(400).json({
              error: 'not_medical_bill',
              message: validation.reason || 'This document does not appear to be a medical or hospital bill.',
              confidence: validation.confidence,
            });
          }

          // PRIORITY 4: Try Gemini text parsing on OCR text
          if (isGeminiAvailable()) {
            console.log('🤖 [Parser] Trying Gemini AI on OCR text...');
            const geminiTextResult = await parseTextWithGemini(ocrResult.text);

            if (geminiTextResult && geminiTextResult.items.length > 0) {
              parsingMethod = 'gemini-text';
              ocrConfidence = geminiTextResult.confidence;

              hospitalName = geminiTextResult.hospitalName;
              billDate = new Date(geminiTextResult.billDate);
              billNumber = geminiTextResult.billNumber;
              cgst = geminiTextResult.cgst || 0;
              sgst = geminiTextResult.sgst || 0;
              parsedItems = geminiTextResult.items.map(item => ({
                rawText: item.itemName,
                itemName: item.itemName,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalBilled: item.totalBilled,
              }));

              console.log(`✅ [Gemini Text] Success: ${parsedItems.length} items extracted`);
            }
          }

          // PRIORITY 5: Final fallback to basic regex parsing
          if (parsedItems.length === 0) {
            console.log('🔧 [Parser] Using basic regex parser (last resort)...');
            parsingMethod = 'ocr-regex';
            const regexParsed = parseBillText(ocrResult.text);
            hospitalName = regexParsed.hospitalName || 'Unknown Hospital';
            billDate = regexParsed.billDate || new Date();
            billNumber = regexParsed.billNumber;
            discount = regexParsed.discount || 0;
            cgst = regexParsed.cgst || 0;
            sgst = regexParsed.sgst || 0;
            parsedItems = regexParsed.items;

            console.log(`✅ [Regex] Extracted ${parsedItems.length} items`);
          }
        }
      } else {
        // Use mock data for demo
        isDemo = true;
        parsingMethod = 'demo-mock';
        const mockBill = mockOcrResult();
        const regexParsed = parseBillText(mockBill.text);
        hospitalName = regexParsed.hospitalName || 'City General Hospital';
        billDate = regexParsed.billDate || new Date();
        billNumber = regexParsed.billNumber;
        discount = regexParsed.discount || 0;
        cgst = regexParsed.cgst || 0;
        sgst = regexParsed.sgst || 0;
        parsedItems = regexParsed.items;
        ocrConfidence = mockBill.confidence;
      }

      // Compare prices against government database
      const comparisonResults = comparePrices(parsedItems, priceDatabase);
      const summary = calculateSummary(comparisonResults);

      // Create analysis record
      const analysis: BillAnalysis = {
        id: generateId(),
        userId: user?.id || 'anonymous',
        hospitalName,
        billDate,
        uploadedAt: new Date(),
        stateId,
        totalBilled: summary.totalBilled,
        totalFairPrice: summary.totalFairPrice,
        overchargeAmount: summary.totalOvercharge,
        itemCount: summary.itemCount,
        overchargedItemCount: summary.overchargedCount,
        status: 'completed',
        items: comparisonResults,
      };

      // Save to history (if authenticated)
      if (user) {
        analyses.set(analysis.id, analysis);
      }

      // Return results
      res.json({
        id: analysis.id,
        hospitalName,
        billDate: billDate.toISOString().split('T')[0],
        billNumber,
        state: statesData[stateId - 1] || statesData[0],
        summary: {
          totalBilled: summary.totalBilled,
          totalFairPrice: summary.totalFairPrice,
          overchargeAmount: summary.totalOvercharge,
          discount,
          cgst,
          sgst,
          itemCount: summary.itemCount,
          overchargedCount: summary.overchargedCount,
          fairCount: summary.fairCount,
          notFoundCount: summary.notFoundCount,
          savingsPercent: summary.savingsPercent,
        },
        items: comparisonResults.map(item => ({
          ...item,
          sourceDate: item.sourceDate?.toISOString().split('T')[0],
        })),
        ocrConfidence,
        parsingMethod, // Let frontend know which method was used
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze bill' });
    }
  });

  // ============================================================================
  // HISTORY ROUTES (protected)
  // ============================================================================

  // Get user's analysis history
  app.get('/api/history', (req: Request, res: Response) => {
    if (!(req as any).isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = (req as any).user;
    const userAnalyses = Array.from(analyses.values())
      .filter(a => a.userId === user.id)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map(a => ({
        id: a.id,
        hospitalName: a.hospitalName,
        billDate: a.billDate?.toISOString().split('T')[0],
        uploadedAt: a.uploadedAt.toISOString(),
        totalBilled: a.totalBilled,
        overchargeAmount: a.overchargeAmount,
        itemCount: a.itemCount,
        overchargedItemCount: a.overchargedItemCount,
      }));

    res.json(userAnalyses);
  });

  // Get single analysis detail
  app.get('/api/history/:id', (req: Request, res: Response) => {
    if (!(req as any).isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = (req as any).user;
    const analysis = analyses.get(req.params.id);

    if (!analysis || analysis.userId !== user.id) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  });

  // Delete analysis
  app.delete('/api/history/:id', (req: Request, res: Response) => {
    if (!(req as any).isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = (req as any).user;
    const analysis = analyses.get(req.params.id);

    if (!analysis || analysis.userId !== user.id) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    analyses.delete(req.params.id);
    res.json({ success: true });
  });

  return httpServer;
}
