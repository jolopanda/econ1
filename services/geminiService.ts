import { GoogleGenAI, Type } from "@google/genai";
import type { EconomicIndicator } from '../types';

// WARNING: This approach is for development and sandbox environments ONLY.
// Exposing your API key in client-side code is a significant security risk.
// In a production environment, you MUST use a serverless function or a backend proxy
// to make this API call securely. This change is made to allow the app to function
// in this specific sandbox environment.

export const fetchEconomicData = async (): Promise<{ data: EconomicIndicator[], sources: string[] }> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a forecast for key economic indicators for the Philippines for the 6 months leading up to and including July 2026. The indicators should be GDP Growth (%), Inflation Rate (%), Unemployment Rate (%), Bank Average Lending Rate (%), GDP in constant 2018 prices (in Trillion PHP), GNI Growth (%), Peso-Dollar Exchange Rate (PHP per USD, End of Period), Underemployment Rate (%), WTI Crude Oil Price (USD per barrel), Overnight Reverse Repurchase Rate (%), Overnight Deposit Facility Rate (%), and Overnight Lending Facility Rate (%). Provide the data month by month. Also, list the following as the typical sources for this kind of data: Bangko Sentral ng Pilipinas (BSP), Philippine Statistics Authority (PSA), National Economic and Development Authority (NEDA), World Bank, International Monetary Fund (IMF), and Asian Development Bank (ADB).",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            data: {
              type: Type.ARRAY,
              description: "An array of monthly economic indicator forecasts.",
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING, description: "The month and year, e.g., 'Feb 2026'" },
                  gdpGrowth: { type: Type.NUMBER, description: "Projected GDP Growth rate as a percentage." },
                  inflationRate: { type: Type.NUMBER, description: "Projected Inflation rate as a percentage." },
                  unemploymentRate: { type: Type.NUMBER, description: "Projected Unemployment rate as a percentage." },
                  lendingRate: { type: Type.NUMBER, description: "Projected Bank Average Lending Rate as a percentage." },
                  gdpConstant: { type: Type.NUMBER, description: "Projected GDP in constant 2018 prices, in Trillion PHP." },
                  gniGrowth: { type: Type.NUMBER, description: "Projected GNI Growth rate as a percentage." },
                  pesoDollarRate: { type: Type.NUMBER, description: "Projected Peso-Dollar Exchange Rate (PHP per USD) at the end of the period." },
                  underemploymentRate: { type: Type.NUMBER, description: "Projected Underemployment rate as a percentage." },
                  wtiCrudeOil: { type: Type.NUMBER, description: "Projected WTI Crude Oil Price in USD per barrel." },
                  reverseRepoRate: { type: Type.NUMBER, description: "Projected Overnight Reverse Repurchase Rate as a percentage." },
                  depositFacilityRate: { type: Type.NUMBER, description: "Projected Overnight Deposit Facility Rate as a percentage." },
                  lendingFacilityRate: { type: Type.NUMBER, description: "Projected Overnight Lending Facility Rate as a percentage." },
                },
                required: ["month", "gdpGrowth", "inflationRate", "unemploymentRate", "lendingRate", "gdpConstant", "gniGrowth", "pesoDollarRate", "underemploymentRate", "wtiCrudeOil", "reverseRepoRate", "depositFacilityRate", "lendingFacilityRate"],
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
      console.error("Data received from Gemini API is not in the expected format:", result);
      throw new Error("The data format from the Gemini API is incorrect.");
    }
  } catch (error) {
    console.error("Error fetching from Gemini API:", error);
    if (error instanceof Error) {
        // Provide a more user-friendly message for common API key issues
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided API key is not valid. Please check your configuration.');
        }
        throw new Error(`An error occurred while communicating with the Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching data.");
  }
};
