// This file represents a a serverless function that runs on a backend (like Vercel).
// It securely uses the API key on the server and is not exposed to the client browser.
// When deployed, Vercel automatically creates an API endpoint at /api/economic-data.

import { GoogleGenAI, Type } from "@google/genai";
import type { EconomicIndicator, Source, IndicatorKey } from '../types';
import { INDICATORS_MAP } from '../types';


// Helper function to get property keys for the JSON schema
const getPropertyKeysForIndicators = (indicators: IndicatorKey[]) => {
    const properties: { [key in IndicatorKey]?: { type: Type.NUMBER } } = {};
    indicators.forEach(key => {
        properties[key] = { type: Type.NUMBER };
    });
    return properties;
}

// The core logic for fetching data from the Gemini API
async function getEconomicData(indicators: IndicatorKey[]): Promise<{ data: EconomicIndicator[], sources: Source[] }> {
  if (!process.env.API_KEY) {
    // This error is logged on the server, not shown to the user directly.
    throw new Error("API_KEY environment variable not set on the server.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Dynamically generate the list of indicators for the prompt.
  const indicatorNames = indicators.map(key => INDICATORS_MAP[key].name).join('\n- ');
  const indicatorKeys = indicators.map(key => `"${key}"`); // for the example

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Use Google Search to find the most recent 12 months of verifiable economic data for these specific indicators in the Philippines:\n- ${indicatorNames}`,
    config: {
      systemInstruction: `You are a data API. Your sole purpose is to retrieve verifiable economic data using the Google Search tool and return it in the specified JSON format. You MUST NOT add any conversational text, markdown, or explanations. The response must be only the raw JSON object. Use your search results for all data points; do not use pre-existing knowledge. If data for a specific month is unavailable for an indicator, use a null value.`,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                ...getPropertyKeysForIndicators(indicators)
              },
              required: ['month', ...indicators]
            }
          }
        },
        required: ['data']
      },
    },
  });

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const webSources: Source[] = [];
  if (groundingMetadata?.groundingChunks) {
    const uniqueSources = new Map<string, Source>();
    for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
            uniqueSources.set(chunk.web.uri, { title: chunk.web.title, uri: chunk.web.uri });
        }
    }
    webSources.push(...uniqueSources.values());
  }

  try {
    const parsedResult = JSON.parse(response.text);
    if (parsedResult && Array.isArray(parsedResult.data)) {
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
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { indicators } = req.body;
    if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
        return res.status(400).json({ message: "Bad Request: 'indicators' must be a non-empty array." });
    }

    const result = await getEconomicData(indicators);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in serverless function:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    res.status(500).json({ message: "Failed to fetch economic data.", details: errorMessage });
  }
}