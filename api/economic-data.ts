// This file represents a a serverless function that runs on a backend (like Vercel).
// It securely uses the API key on the server and is not exposed to the client browser.
// When deployed, Vercel automatically creates an API endpoint at /api/economic-data.

import { GoogleGenAI } from "@google/genai";
import type { EconomicIndicator, Source } from '../types';

// The core logic for fetching data from the Gemini API
async function getEconomicData(): Promise<{ data: EconomicIndicator[], sources: Source[] }> {
  if (!process.env.API_KEY) {
    // This error is logged on the server, not shown to the user directly.
    throw new Error("API_KEY environment variable not set on the server.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
**Primary Directive: Use Google Search to find verifiable economic data for the Philippines.**

Your role is a financial data analyst. You **MUST** use the Google Search tool to gather the most recent 12 months of available data for these specific indicators in the Philippines:
- Bank Average Lending Rate (%)
- GDP Growth (%)
- Inflation Rate (%)
- Peso-Dollar Exchange Rate (PHP per USD, End of Period)
- Underemployment Rate (%)
- Unemployment Rate (%)
- WTI Crude Oil Price (USD per barrel)
- Overnight RRP Rate (%)
- Overnight Deposit Facility Rate (%)
- Overnight Lending Facility Rate (%)

**Output Requirements:**
1.  The output **MUST** be a single, valid JSON object. Do not add any text, markdown, or explanations before or after the JSON.
2.  The JSON object must have a single top-level key: "data".
3.  The "data" key must contain an array of objects, where each object represents one month of data.
4.  **Crucially, all data must be sourced from your Google Search results.** The API response must include the grounding metadata from your searches. Do not use internal or pre-existing knowledge.

Example for one object in the "data" array:
{
  "month": "YYYY-MM",
  "bankAverageLendingRate": 7.1,
  "gdpGrowth": 5.7,
  "inflationRate": 3.9,
  "pesoDollarRate": 58.65,
  "underemploymentRate": 12.0,
  "unemploymentRate": 4.0,
  "wtiCrudeOil": 81.5,
  "overnightRrpRate": 6.5,
  "overnightDepositFacilityRate": 6.0,
  "overnightLendingFacilityRate": 7.0
}
`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  // Extract web sources from grounding metadata, format them, and remove duplicates.
  const webSources: Source[] = [];
  if (groundingMetadata?.groundingChunks) {
    const uniqueSources = new Map<string, Source>();
    for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
            // Use URI as the key to ensure uniqueness
            uniqueSources.set(chunk.web.uri, { title: chunk.web.title, uri: chunk.web.uri });
        }
    }
    webSources.push(...uniqueSources.values());
  }

  // Robustly parse the JSON from the response text.
  let jsonText = response.text.trim();
  const jsonStart = jsonText.indexOf('{');
  const jsonEnd = jsonText.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1).trim();
  }

  try {
    const parsedResult = JSON.parse(jsonText);
    
    if (parsedResult && Array.isArray(parsedResult.data)) {
      // Construct the final object with data from the model and sources from grounding.
      return {
        data: parsedResult.data,
        sources: webSources,
      };
    } else {
      console.error("Parsed JSON does not match expected structure. Parsed object:", parsedResult);
      throw new Error("Parsed data from Gemini is not in the expected format.");
    }
  } catch (error) {
    console.error("Failed to parse JSON from Gemini response. Raw text:", response.text);
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new Error(`Failed to parse JSON from the AI's response. Details: ${errorMessage}`);
  }
}

// Vercel serverless function handler
// This function receives the request and sends the response.
export default async function handler(req, res) {
  // Allow requests from the frontend origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const result = await getEconomicData();
    // Vercel enables caching by default. 'no-store' prevents stale data.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in serverless function:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    res.status(500).json({ message: "Failed to fetch economic data.", details: errorMessage });
  }
}