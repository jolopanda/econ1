
import React from 'react';
import { INDICATORS_MAP, IndicatorKey } from '../types';

interface IndicatorPanelProps {
  displayedIndicators: IndicatorKey[];
  onExportCSV: () => void;
  isExportDisabled: boolean;
}

const IndicatorPanel: React.FC<IndicatorPanelProps> = ({
  displayedIndicators,
  onExportCSV,
  isExportDisabled,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Displayed Indicators</h2>
        <button
          onClick={onExportCSV}
          disabled={isExportDisabled}
          className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors text-sm"
          aria-label="Export displayed data to CSV"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="space-y-3">
        {displayedIndicators.map(key => {
          const indicator = INDICATORS_MAP[key];
          return (
            <div key={key} className="flex items-center justify-between p-2 rounded-md bg-gray-700/30">
              <div className="flex items-center space-x-3">
                  <span 
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: indicator.color }}
                    aria-hidden="true"
                  ></span>
                  <span className="text-sm text-gray-300 select-none">{indicator.name}</span>
              </div>
              {indicator.thresholdDescription && (
                 <div className="relative group flex-shrink-0 ml-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <div 
                    className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                    role="tooltip"
                  >
                     <span className="font-bold text-white">Outlook Threshold Explained:</span> {indicator.thresholdDescription}
                   </div>
                 </div>
              )}
            </div>
          );
        })}
      </div>
       <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-700 text-center">
        Data for all available indicators is fetched automatically.
      </p>
    </div>
  );
};

export default IndicatorPanel;
