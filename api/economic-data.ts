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
      Using Google Search, find the last 12 months of available historical data for the following economic indicators in the Philippines:
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

      Prioritize primary data from official sources like the Bangko Sentral ng Pilipinas (BSP), Philippine Statistics Authority (PSA), and Asian Development Bank (ADB).

      Return ONLY a single JSON object. This object must have a single key "data" that contains an array of 12 monthly data points. Each object in the array should have a "month" key and camelCase keys for each indicator (e.g., "bankAverageLendingRate", "gdpGrowth"). Do not include markdown formatting or any other text outside the JSON object.
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