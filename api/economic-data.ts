// This file represents a serverless function that runs on a backend (like Vercel).
// It securely uses the API key on the server and is not exposed to the client browser.
// When deployed, Vercel automatically creates an API endpoint at /api/economic-data.

import { GoogleGenAI, Type } from "@google/genai";
import type { EconomicIndicator } from '../types';

// The core logic for fetching data from the Gemini API
async function getEconomicData(): Promise<{ data: EconomicIndicator[], sources: string[] }> {
  if (!process.env.API_KEY) {
    // This error is logged on the server, not shown to the user directly.
    throw new Error("API_KEY environment variable not set on the server.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Generate a dataset for key economic indicators for the Philippines, based on the provided list. Provide historical data from February 2025 to July 2025, and then a forecast from August 2025 to July 2026. For each monthly data point, include a 'type' field which must be either 'Historical' or 'Forecast'. The indicators are: Bank Average Lending Rate (%), GDP Growth (%), Inflation Rate (%), Peso-Dollar Exchange Rate (PHP per USD, End of Period), Underemployment Rate (%), Unemployment Rate (%), WTI Crude Oil Price (USD per barrel), Overnight RRP Rate (%), Overnight Deposit Facility Rate (%), and Overnight Lending Facility Rate (%). Provide the data month by month. Also, list the following as the data sources: \"Bangko Sentral ng Pilipinas (BSP) for rates: Bank Average Lending Rate, Inflation Rate, Peso-Dollar, Overnight RRP, Overnight Deposit Facility, Overnight Lending Facility\", \"Philippine Statistics Authority (PSA) for: GDP, Unemployment, Underemployment\", and \"U.S. Energy Information Administration (EIA) for: WTI Crude Oil\".",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          data: {
            type: Type.ARRAY,
            description: "An array of 18 monthly economic indicator data points, with historical data from February 2025 to July 2025 and forecast data from August 2025 to July 2026.",
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING, description: "The month and year, e.g., 'Feb 2025'" },
                type: { type: Type.STRING, description: "The type of data, either 'Historical' or 'Forecast'." },
                bankAverageLendingRate: { type: Type.NUMBER, description: "Projected Bank Average Lending Rate as a percentage." },
                gdpGrowth: { type: Type.NUMBER, description: "Projected GDP Growth rate as a percentage." },
                inflationRate: { type: Type.NUMBER, description: "Projected Inflation rate as a percentage." },
                pesoDollarRate: { type: Type.NUMBER, description: "Projected Peso-Dollar Exchange Rate (PHP per USD) at the end of the period." },
                underemploymentRate: { type: Type.NUMBER, description: "Projected Underemployment rate as a percentage." },
                unemploymentRate: { type: Type.NUMBER, description: "Projected Unemployment rate as a percentage." },
                wtiCrudeOil: { type: Type.NUMBER, description: "Projected WTI Crude Oil Price in USD per barrel." },
                overnightRrpRate: { type: Type.NUMBER, description: "Projected Overnight RRP Rate as a percentage." },
                overnightDepositFacilityRate: { type: Type.NUMBER, description: "Projected Overnight Deposit Facility Rate as a percentage." },
                overnightLendingFacilityRate: { type: Type.NUMBER, description: "Projected Overnight Lending Facility Rate as a percentage." },
              },
              required: ["month", "type", "bankAverageLendingRate", "gdpGrowth", "inflationRate", "pesoDollarRate", "underemploymentRate", "unemploymentRate", "wtiCrudeOil", "overnightRrpRate", "overnightDepositFacilityRate", "overnightLendingFacilityRate"],
            },
          },
          sources: {
            type: Type.ARRAY,
            description: "A list of typical sources for the data.",
            items: {
              type: Type.STRING
            }
          }
        },
        required: ["data", "sources"],
      },
    },
  });

  const jsonText = response.text.trim();
  const result = JSON.parse(jsonText);

  if (result && Array.isArray(result.data) && Array.isArray(result.sources)) {
    return result;
  } else {
    throw new Error("Parsed data from Gemini is not in the expected format.");
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
