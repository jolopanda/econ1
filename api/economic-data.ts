// This file represents a a serverless function that runs on a backend (like Vercel).
// It securely uses the API key on the server and is not exposed to the client browser.
// When deployed, Vercel automatically creates an API endpoint at /api/economic-data.

import { GoogleGenAI } from "@google/genai";
import type { EconomicIndicator, IndicatorKey, Source } from '../types';
import { INDICATORS_MAP } from '../types'; // Import the map to access names and units

// Helper to generate a dynamic prompt
const createDynamicPrompt = (indicators: IndicatorKey[]): string => {
    const indicatorList = indicators.map(key => {
        const meta = INDICATORS_MAP[key];
        return `- ${meta.name} (key: "${key}")`;
    }).join('\n');

    const exampleFields = indicators.map(key => `"${key}": 12.3`).join(',\n    ');

    return `
You are a financial data analyst API. Your task is to use Google Search to find the most recent 12 months of economic data for the Philippines for the following indicators:
${indicatorList}

**RESPONSE FORMAT INSTRUCTIONS:**
- Your entire response **MUST** be a single, raw, valid JSON object.
- Do **NOT** wrap the JSON in markdown backticks (\`\`\`) or any other text.
- The JSON object must have one root key: "data".
- The "data" value must be an array of objects, one for each month.
- Each object in the array must have a "month" key in "YYYY-MM" format and keys for the requested indicators.
- Use the provided keys (e.g., "gdpGrowth") in the output.
- If data for a specific indicator in a specific month is not available, omit the key or set its value to null.

**EXAMPLE RESPONSE STRUCTURE:**
{
  "data": [
    {
      "month": "2023-07",
      ${exampleFields}
    },
    {
      "month": "2023-08",
      ${exampleFields}
    }
  ]
}
`;
};


// The core logic for fetching data from the Gemini API
async function getEconomicData(indicators: IndicatorKey[]): Promise<{ data: EconomicIndicator[], sources: Source[] }> {
  if (!process.env.API_KEY) {
    // This error is logged on the server, not shown to the user directly.
    throw new Error("API_KEY environment variable not set on the server.");
  }
  if (!indicators || indicators.length === 0) {
      return { data: [], sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = createDynamicPrompt(indicators);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are an expert financial data analyst API. Your sole purpose is to retrieve economic data using Google Search and return it in the exact JSON format specified in the prompt. You must not include any conversational text or markdown formatting in your response.",
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
  // Allow requests from any origin for simplicity in this context.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { indicators } = req.body;

    if (!Array.isArray(indicators) || indicators.length === 0) {
        return res.status(400).json({ message: 'Please provide an array of indicators.'});
    }

    const result = await getEconomicData(indicators);
    // Vercel enables caching by default. 'no-store' prevents stale data.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in serverless function:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    res.status(500).json({ message: "Failed to fetch economic data.", details: errorMessage });
  }
}