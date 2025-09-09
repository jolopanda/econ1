
import React from 'react';
import { INDICATORS_MAP, IndicatorKey } from '../types';

interface IndicatorSelectorProps {
  selectedIndicators: IndicatorKey[];
  onIndicatorChange: (key: IndicatorKey) => void;
  onExportCSV: () => void;
  isExportDisabled: boolean;
  fetchingIndicators: IndicatorKey[];
}

const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  selectedIndicators,
  onIndicatorChange,
  onExportCSV,
  isExportDisabled,
  fetchingIndicators,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Indicators</h2>
        <button
          onClick={onExportCSV}
          disabled={isExportDisabled}
          className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="space-y-2">
        {(Object.keys(INDICATORS_MAP) as IndicatorKey[]).map(key => {
          const indicator = INDICATORS_MAP[key];
          const isChecked = selectedIndicators.includes(key);
          const isFetching = fetchingIndicators.includes(key);
          return (
            <div key={key} className="flex items-center justify-between">
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-700/50 transition-colors flex-grow">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onIndicatorChange(key)}
                  className="sr-only"
                  disabled={isFetching}
                />
                <span
                  className="h-5 w-5 rounded-md flex items-center justify-center transition-all duration-200 ring-1 ring-offset-2 ring-offset-gray-800"
                  style={{ 
                    backgroundColor: isChecked ? indicator.color : 'transparent',
                    borderColor: indicator.color,
                    '--tw-ring-color': isChecked ? indicator.color : 'transparent'
                  } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {isChecked && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-gray-300 select-none">{indicator.name}</span>
                {isFetching && (
                   <svg className="animate-spin h-4 w-4 text-gray-400 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </label>
              {indicator.thresholdDescription && (
                 <div className="relative group flex-shrink-0 ml-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                     <span className="font-bold text-white">Outlook Threshold Explained:</span> {indicator.thresholdDescription}
                   </div>
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndicatorSelector;
