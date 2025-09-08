
import React from 'react';
import { Source } from '../types';

interface SourceListProps {
  sources: Source[];
}

const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Data Sources</h2>
      <ul className="space-y-3">
        {sources.map((source) => {
          let hostname = 'unknown source';
          try {
             hostname = new URL(source.uri).hostname.replace(/^www\./, '');
          } catch (e) {
            console.error("Invalid source URI:", source.uri);
          }
          
          return (
            <li key={source.uri}>
              <a
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-blue-500 transition-all duration-300 group"
                title={source.uri}
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-sm text-blue-400 group-hover:text-blue-300 pr-2">{source.title}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{hostname}</p>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default SourceList;
