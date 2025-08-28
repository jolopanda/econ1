import React, { useState, useEffect, useCallback } from 'react';
import EconomicChart from './components/EconomicChart';
import { fetchEconomicData } from './services/geminiService';
import { EconomicIndicator, INDICATORS_MAP, IndicatorKey } from './types';

const App: React.FC = () => {
  const [allData, setAllData] = useState<EconomicIndicator[] | null>(null);
  const [sources, setSources] = useState<string[] | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorKey[]>([
    'gdpGrowth', 
    'inflationRate', 
    'unemploymentRate'
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, sources } = await fetchEconomicData();
      setAllData(data);
      setSources(sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleIndicatorChange = (indicatorKey: IndicatorKey) => {
    setSelectedIndicators(prev => 
      prev.includes(indicatorKey)
        ? prev.filter(item => item !== indicatorKey)
        : [...prev, indicatorKey]
    );
  };

  const handleExportCSV = useCallback(() => {
    if (!allData || selectedIndicators.length === 0) {
      return;
    }

    // Create Headers
    const headers = ['Month', ...selectedIndicators.map(key => `"${INDICATORS_MAP[key].name}"`)].join(',');

    // Create Rows
    const rows = allData.map(row => {
      const values = [
        `"${row.month}"`,
        ...selectedIndicators.map(key => row[key])
      ];
      return values.join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'philippine-economic-outlook.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [allData, selectedIndicators]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <svg className="animate-spin h-10 w-10 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold text-gray-300">Generating Economic Forecast...</p>
          <p className="text-gray-400 mt-2">Please wait while Gemini analyzes a comprehensive set of economic indicators.</p>
        </div>
      );
    }

    if (error) {
      const isApiKeyError = /API_KEY environment variable not set/i.test(error);
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
          <p className="text-xl font-semibold text-red-300">{isApiKeyError ? "Configuration Error" : "Error Fetching Data"}</p>
          <p className="text-red-400 mt-2 max-w-2xl">
            {isApiKeyError ? (
              <>
                The <code>API_KEY</code> is missing on the server. If you are the application owner, please go to your deployment platform (e.g., Vercel), add an Environment Variable named <code>API_KEY</code> with your Gemini API key, and then redeploy the application.
              </>
            ) : (
              error
            )}
          </p>
          <button
            onClick={loadData}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (allData) {
      return <EconomicChart data={allData} selectedIndicators={selectedIndicators} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            Philippine Economic Outlook
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Projected Key Indicators for July 2026
          </p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-200">Select Indicators to Display:</h2>
              <button
                onClick={handleExportCSV}
                disabled={!allData || selectedIndicators.length === 0}
                className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(Object.keys(INDICATORS_MAP) as IndicatorKey[]).map(key => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIndicators.includes(key)}
                    onChange={() => handleIndicatorChange(key)}
                    className="form-checkbox h-5 w-5 rounded transition duration-150 ease-in-out"
                    style={{ accentColor: INDICATORS_MAP[key].color }}
                  />
                  <span className="text-sm text-gray-300">{INDICATORS_MAP[key].name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="min-h-[400px] flex items-center justify-center">
            {renderContent()}
          </div>
        </main>
        
        {sources && sources.length > 0 && (
          <section className="mt-8 text-gray-400 text-sm">
            <h3 className="font-semibold text-gray-300 mb-2">Data Sources</h3>
            <ul className="list-disc list-inside bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              {sources.map((source, index) => (
                <li key={index}>{source}</li>
              ))}
            </ul>
          </section>
        )}

        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Data visualized with React & Recharts.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;