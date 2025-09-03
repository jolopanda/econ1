
import React, { useState, useEffect, useCallback } from 'react';
import EconomicChart from './components/EconomicChart';
import { fetchEconomicData } from './services/geminiService';
import { EconomicIndicator, INDICATORS_MAP, IndicatorKey, Source } from './types';

// Helper to parse and format error messages for better UX
const getFriendlyErrorMessage = (error: string | null): { title: string; message: string; isHtml: boolean } => {
  if (!error) {
    return { title: 'An Unknown Error Occurred', message: 'An unexpected error occurred. Please try again.', isHtml: false };
  }

  // Handle specific, known error messages first
  if (/API_KEY environment variable not set/i.test(error)) {
    return {
      title: 'Configuration Error',
      message: 'The <code>API_KEY</code> is missing on the server. If you are the application owner, please go to your deployment platform (e.g., Vercel), add an Environment Variable named <code>API_KEY</code> with your Gemini API key, and then redeploy the application.',
      isHtml: true,
    };
  }
  
  // Attempt to parse JSON from the error string to extract a cleaner message
  const jsonMatch = error.match(/{.*}/s);
  if (jsonMatch && jsonMatch[0]) {
    try {
      const errorObj = JSON.parse(jsonMatch[0]);
      // Check for standard Gemini API error format or our serverless function's format
      const message = errorObj?.error?.message || errorObj?.details || errorObj?.message;
      if (message && typeof message === 'string') {
        return { title: 'Error Fetching Data', message, isHtml: false };
      }
    } catch (e) {
      // Parsing failed, fall through to default.
    }
  }

  // Fallback to the original error if it's not a recognized format.
  return {
    title: 'Error Fetching Data',
    message: error,
    isHtml: false,
  };
};

const App: React.FC = () => {
  const [allData, setAllData] = useState<EconomicIndicator[] | null>(null);
  const [sources, setSources] = useState<Source[] | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorKey[]>([
    'gdpGrowth', 
    'inflationRate', 
    'unemploymentRate'
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSources(null); // Reset sources on new load
    try {
      const { data, sources } = await fetchEconomicData();
      
      // Sort the data by month to ensure the chart renders correctly
      const sortedData = data.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      
      setAllData(sortedData);
      setSources(sources);

      if (sortedData && sortedData.length > 0) {
        const firstMonth = sortedData[0].month;
        const lastMonth = sortedData[sortedData.length - 1].month;
        setDateRange(`Displaying data from ${firstMonth} to ${lastMonth}`);
      }

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
    link.setAttribute('download', 'philippine-economic-data.csv');
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
          <p className="text-xl font-semibold text-gray-300">Loading Economic Data...</p>
          <p className="text-gray-400 mt-2">Fetching and verifying sources...</p>
        </div>
      );
    }

    if (error) {
      const { title, message, isHtml } = getFriendlyErrorMessage(error);
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
          <p className="text-xl font-semibold text-red-300">{title}</p>
          {isHtml ? (
            <p
              className="text-red-400 mt-2 max-w-2xl"
              dangerouslySetInnerHTML={{ __html: message }}
            />
          ) : (
            <p className="text-red-400 mt-2 max-w-2xl">
              {message}
            </p>
          )}
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
            Philippine Economic Data
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            {dateRange || 'Historical Economic Indicators'}
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
              {(Object.keys(INDICATORS_MAP) as IndicatorKey[]).map(key => {
                  const indicator = INDICATORS_MAP[key];
                  const isChecked = selectedIndicators.includes(key);
                  return (
                    <div key={key} className="flex items-center space-x-1.5">
                      <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-700/50 transition-colors flex-grow">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleIndicatorChange(key)}
                          className="sr-only"
                        />
                        <span
                          className="h-4 w-4 rounded-sm flex items-center justify-center transition-colors flex-shrink-0"
                          style={{ backgroundColor: isChecked ? indicator.color : '#FFFFFF' }}
                          aria-hidden="true"
                        >
                          {isChecked && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm text-gray-300">{indicator.name}</span>
                      </label>
                      {indicator.thresholdDescription && (
                         <div className="relative group flex-shrink-0">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           <div className="absolute bottom-full mb-2 w-64 p-2 bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 -translate-x-1/2 left-1/2">
                             <span className="font-bold">Target Explanation:</span> {indicator.thresholdDescription}
                           </div>
                         </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
          <div className="min-h-[400px] flex items-center justify-center">
            {renderContent()}
          </div>
           {sources && !isLoading && sources.length > 0 && (
            <section className="mt-6 border-t border-gray-700 pt-4 text-gray-400 text-sm">
              <h3 className="font-semibold text-gray-300 mb-2">Data Sources</h3>
                <ul className="space-y-1">
                  {sources.map((source) => (
                    <li key={source.uri}>
                      <a
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline hover:text-blue-300 transition-colors inline-flex items-start"
                        title={source.uri}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>{source.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
            </section>
          )}
        </main>
        
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Data visualized with React & Recharts.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
