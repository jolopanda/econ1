
import React from 'react';
import { Source } from '../types';

interface SourceListProps {
  sources: Source[];
}

const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  return (
    <section className="mt-8">
      <h3 className="text-2xl font-bold text-gray-100 mb-4">Data Sources</h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="block p-4 rounded-lg bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 hover:border-blue-500 transition-all duration-300 group h-full transform hover:-translate-y-1"
                title={source.uri}
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-blue-400 group-hover:text-blue-300 pr-2 line-clamp-2">{source.title}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">{hostname}</p>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default SourceList;
