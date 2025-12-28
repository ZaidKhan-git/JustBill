# Bill-Guardian

A robust medical bill parser that uses AI (Mindee & Gemini) to extract structured data from bill images, with fallback to OCR and regex.

## Features

- **Multi-layered Parsing:** Uses Mindee Invoice API (tier 1), Google Gemini Vision (tier 2), and OCR/Regex (tier 3).
- **Intelligent Filtering:** Filters out metadata (addresses, phone numbers) and keeps only genuine billable items.
- **Fair Pricing Analysis:** Compares extracted prices against government reference rates (CGHS/NPPA).
- **Interactive Dashboard:** View analysis results, item breakdowns, and savings potential.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Bill-Guardian
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   *(Note: If `.env.example` doesn't exist, just create a new `.env` file)*

2. Add your API keys:
   ```env
   # Mindee Invoice OCR API Key (Get from https://platform.mindee.com/)
   MINDEE_API_KEY=your_mindee_key_here

   # Google Gemini API Key (Get from https://aistudio.google.com/app/apikey)
   GEMINI_API_KEY=your_gemini_key_here
   
   # Optional: Database URL for production
   # DATABASE_URL=postgresql://user:pass@host:5432/billguardian
   ```

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React, Vite
- **AI/ML:** Google Gemini, Mindee, Tesseract.js (OCR)
- **Database:** PostgreSQL (with Drizzle ORM)
