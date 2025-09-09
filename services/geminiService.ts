import type { EconomicIndicator, Source, IndicatorKey } from '../types';

export const fetchEconomicData = async (indicators: IndicatorKey[]): Promise<{ data: EconomicIndicator[], sources: Source[] }> => {
  try {
    // This will call the serverless function located at /api/economic-data when deployed on Vercel.
    const response = await fetch('/api/economic-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ indicators }),
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status: ${response.status}`;
      try {
        const errorBody = await response.json();
        // Use the detailed error message from the serverless function if available.
        errorMessage = errorBody.details || errorBody.message || errorMessage;
      } catch (e) {
        // The response body was not JSON; use the default error message.
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (result && Array.isArray(result.data) && Array.isArray(result.sources)) {
      return result;
    } else {
      console.error("Data received from API is not in the expected format:", result);
      throw new Error("The data format from the API is incorrect.");
    }
  } catch (error) {
    console.error("Error fetching economic data:", error);
    if (error instanceof Error) {
        // Re-throw the error with a more user-friendly context.
        throw new Error(`An error occurred while fetching the economic data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching data.");
  }
};