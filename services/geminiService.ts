import type { EconomicIndicator } from '../types';

// This function now fetches data from our own backend API endpoint.
// The serverless function at /api/economic-data handles the secure call to the Gemini API.
export const fetchEconomicData = async (): Promise<{ data: EconomicIndicator[], sources: string[] }> => {
  try {
    // In a real deployment on a platform like Vercel or Netlify, a request to this path
    // would automatically be routed to the serverless function located at /api/economic-data.ts.
    // NOTE: This will fail in the current sandbox environment as there is no backend server.
    const response = await fetch('/api/economic-data');

    if (!response.ok) {
      // Try to parse error response from the serverless function, if any.
      const errorBody = await response.text();
      let errorMessage = `Server responded with ${response.status}: ${response.statusText}.`;
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.message) {
          errorMessage += ` Details: ${errorJson.message}`;
        }
      } catch (e) {
        // Not a JSON response, just append the body text if it's not too long.
        if (errorBody) {
          errorMessage += ` Response: ${errorBody.substring(0, 100)}`;
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Basic validation on the client side as well.
    if (result && Array.isArray(result.data) && Array.isArray(result.sources)) {
      return result as { data: EconomicIndicator[], sources: string[] };
    } else {
      console.error("Data received from API is not in the expected format:", result);
      throw new Error("The data format from the server is incorrect.");
    }
  } catch (error) {
    console.error("Error fetching from /api/economic-data:", error);

    if (error instanceof TypeError) { 
      // This is the most likely error in this sandbox: a network failure because the endpoint doesn't exist.
      throw new Error("Failed to connect to the backend API. This is expected in this environment. In a real deployment, it would indicate a server issue.");
    }

    // Re-throw the original error or a generic one.
    throw new Error(error instanceof Error ? error.message : "An unknown error occurred while fetching data.");
  }
};
