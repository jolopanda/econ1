
import React, { useState, useEffect, useCallback } from 'react';
import EconomicChart from './components/EconomicChart';
import SourceList from './components/SourceList';
import { fetchEconomicData } from './services/geminiService';
import { EconomicIndicator, INDICATORS_MAP, IndicatorKey, Source } from './types';

// Define primary, trusted sources to show by default.
const PRIMARY_SOURCES: Source[] = [
  { title: 'Bangko Sentral ng Pilipinas (BSP)', uri: 'https://www.bsp.gov.ph/' },
  { title: 'Philippine Statistics Authority (PSA)', uri: 'https://psa.gov.ph/' },
  { title: 'Asian Development Bank (ADB)', uri: 'https://www.adb.org/countries/philippines/main' },
];

// Define a curated list of indicators to display by default for a cleaner chart.
const defaultIndicators: IndicatorKey[] = [
  'gdpGrowth',
  'inflationRate',
  'unemploymentRate',
  'pesoDollarRate',
];

// Helper to parse and format error messages for better UX
const getFriendlyErrorMessage = (error: string | null): { title: string; message: string; isHtml: boolean } => {
  if (!error) {
    return { title: 'An Unknown Error Occurred', message: 'An unexpected error occurred. Please try again.', isHtml: false };
  }

  if (/API_KEY environment variable not set/i.test(error)) {
    return {
      title: 'Configuration Error',
      message: 'The <code>API_KEY</code> is missing on the server. If you are the application owner, please go to your deployment platform (e.g., Vercel), add an Environment Variable named <code>API_KEY</code> with your Gemini API key, and then redeploy the application.',
      isHtml: true,
    };
  }
  
  const jsonMatch = error.match(/{.*}/s);
  if (jsonMatch && jsonMatch[0]) {
    try {
      const errorObj = JSON.parse(jsonMatch[0]);
      const message = errorObj?.error?.message || errorObj?.details || errorObj?.message;
      if (message && typeof message === 'string') {
        return { title: 'Error Fetching Data', message, isHtml: false };
      }
    } catch (e) {
      // Parsing failed, fall through to default.
    }
  }

  return {
    title: 'Error Fetching Data',
    message: error,
    isHtml: false,
  };
};

const App: React.FC = () => {
  const [data, setData] = useState<EconomicIndicator[] | null>(null);
  const [sources, setSources] = useState<Source[]>(PRIMARY_SOURCES);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading immediately
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing...');

  // Effect for cycling through loading messages
  useEffect(() => {
    if (!isLoading) return;

    const messages = [
      'Fetching latest market data...',
      'Analyzing recent trends...',
      'Verifying data sources from the web...',
      'Compiling indicators...',
    ];

    let messageIndex = 0;
    const intervalId = setInterval(() => {
      setLoadingMessage(messages[messageIndex]);
      messageIndex = (messageIndex + 1) % messages.length;
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount or when isLoading changes
  }, [isLoading]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setData(null); // Clear previous data
    setLoadingMessage('Fetching latest market data...');
    try {
      const { data, sources: fetchedSources } = await fetchEconomicData(defaultIndicators);
      const sortedData = data.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      
      setData(sortedData);
      
      // Combine primary and fetched sources, ensuring no duplicates.
      const combinedSources = [...PRIMARY_SOURCES, ...fetchedSources];
      const uniqueSources = Array.from(new Map(combinedSources.map(s => [s.uri, s])).values());
      setSources(uniqueSources);

      if (sortedData && sortedData.length > 0) {
        const firstMonth = sortedData[0].month;
        const lastMonth = sortedData[sortedData.length - 1].month;
        setDateRange(`Data from ${firstMonth} to ${lastMonth}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array as it doesn't depend on any props/state

  // Fetch data on initial component mount.
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleExportCSV = useCallback(() => {
    if (!data) return;

    const headers = ['Month', ...defaultIndicators.map(key => `"${INDICATORS_MAP[key].name}"`)].join(',');
    const rows = data.map(row => {
      const values = [`"${row.month}"`, ...defaultIndicators.map(key => row[key] ?? '')];
      return values.join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'philippine-economic-data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
          <svg className="animate-spin h-10 w-10 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold text-gray-300">{loadingMessage}</p>
          <p className="text-gray-400 mt-2">This may take a moment as we gather the latest information.</p>
        </div>
      );
    }

    if (error) {
      const { title, message, isHtml } = getFriendlyErrorMessage(error);
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl font-semibold text-red-300">{title}</p>
          {isHtml ? (
            <p className="text-red-400 mt-2 max-w-2xl" dangerouslySetInnerHTML={{ __html: message }} />
          ) : (
            <p className="text-red-400 mt-2 max-w-2xl">{message}</p>
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
    
    if (data) {
      return <EconomicChart data={data} selectedIndicators={defaultIndicators} />;
    }

    // This state is unlikely to be seen as isLoading is true initially, but it is a safe fallback.
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-300">Philippine Economic Outlook</h3>
            <p className="text-gray-400 mt-2 max-w-sm">
                Preparing to fetch the latest economic indicators...
            </p>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-screen-xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            Philippine Economic Outlook
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            {dateRange || 'Visualizing Key Economic Indicators'}
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {/* Main Chart Section */}
          <main>
            <section className="bg-gray-800/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-100">Economic Indicators Chart</h2>
                  {data && ( // Only show button when data is loaded
                      <button
                          onClick={handleExportCSV}
                          disabled={isLoading}
                          className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors text-sm"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export CSV
                      </button>
                  )}
              </div>
              <div className="min-h-[420px]">
                {renderContent()}
              </div>
            </section>
          </main>
          
          {/* Data Sources Section */}
          {data && sources && sources.length > 0 && (
            <section className="bg-gray-800/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700">
              <SourceList sources={sources} />
            </section>
          )}
        </div>
        
        <footer className="text-center mt-12 py-6 border-t border-gray-800 text-gray-500 text-sm">
            <div className="max-w-4xl mx-auto px-4">
                <p className="leading-relaxed">
                This application presents a dynamic economic outlook for the Philippines. 
                Data is gathered from the web in real-time using Google's Gemini model to ensure the latest information is available.
                The visualization is built with <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 underline transition-colors">React</a> & <a href="https://recharts.org/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 underline transition-colors">Recharts</a>.
                </p>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
