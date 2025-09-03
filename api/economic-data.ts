// This file represents a serverless function that runs on a backend (like Vercel).
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
      You are an expert economic data analyst. Your task is to provide a dataset of key economic indicators for the Philippines.

      1.  **Use Google Search** to find the most recent, official data for the following indicators: Bank Average Lending Rate (%), GDP Growth (%), Inflation Rate (%), Peso-Dollar Exchange Rate (PHP per USD, End of Period), Underemployment Rate (%), Unemployment Rate (%), WTI Crude Oil Price (USD per barrel), Overnight RRP Rate (%), Overnight Deposit Facility Rate (%), and Overnight Lending Facility Rate (%).

      2.  Provide the **last 12 months of available historical data**.

      3.  Format your entire response as a single JSON object with a single key: \`data\`. The \`data\` key must contain the array of 12 monthly data points.

      **Crucially, the JSON output must strictly follow this structure, with no extra text, explanations, or "type" field:**
      \`\`\`json
      {
        "data": [
          {
            "month": "Jan 2025",
            "bankAverageLendingRate": 5.5,
            "gdpGrowth": 6.2,
            "inflationRate": 3.1,
            "pesoDollarRate": 58.5,
            "underemploymentRate": 14.1,
            "unemploymentRate": 4.5,
            "wtiCrudeOil": 80.0,
            "overnightRrpRate": 6.5,
            "overnightDepositFacilityRate": 6.0,
            "overnightLendingFacilityRate": 7.0
          }
        ]
      }
      \`\`\`
    `,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  // Extract web sources from grounding metadata as objects and remove duplicates based on URI.
  const webSources: Source[] = groundingMetadata?.groundingChunks
    ?.map(chunk => (chunk.web && chunk.web.uri ? { title: chunk.web.title || '', uri: chunk.web.uri } : null))
    .filter((source): source is Source => source !== null) // Type guard to filter out nulls
    .filter((source, index, self) => 
        index === self.findIndex((s) => s.uri === source.uri) // Keep only unique sources by URI
    ) ?? [];


  // Robustly parse the JSON from the response text, which might be wrapped in markdown.
  let jsonText = response.text.trim();
  const jsonStart = jsonText.indexOf('```json');
  const jsonEnd = jsonText.lastIndexOf('```');

  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    jsonText = jsonText.substring(jsonStart + 7, jsonEnd).trim();
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