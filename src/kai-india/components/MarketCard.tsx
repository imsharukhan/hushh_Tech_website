import React from 'react';
import { MarketItem } from '../types';

interface MarketCardProps {
  title: string;
  items?: MarketItem[];
  isLoading?: boolean;
  onSelect?: (itemName: string) => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({ title, items = [], isLoading = false, onSelect }) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-5 md:p-8 rounded-3xl w-full h-[450px] flex flex-col hover:shadow-xl hover:shadow-black/50 transition-all duration-500 relative overflow-hidden">
      <h3 className="text-lg font-semibold mb-6 text-white tracking-tight">
        {title}
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
        {isLoading ? (
          <div className="space-y-5 mt-2">
            {[...Array(6)].map((_, i) => (
               <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0">
                  <div className="space-y-2 w-2/3">
                    <div className="h-4 animate-shimmer-dark rounded-md w-3/4"></div>
                    <div className="h-3 animate-shimmer-dark rounded-md w-1/3"></div>
                  </div>
                  <div className="space-y-2 w-1/4 flex flex-col items-end">
                    <div className="h-4 animate-shimmer-dark rounded-md w-full"></div>
                    <div className="h-3 animate-shimmer-dark rounded-md w-1/2"></div>
                  </div>
               </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-sm font-light text-center p-4">
             <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center mb-2 text-neutral-600">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
               </svg>
             </div>
             <p>No active data found</p>
             <p className="text-xs text-neutral-600 mt-1">Markets might be closed</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={!onSelect}
              className="group flex w-full justify-between items-center text-left cursor-pointer disabled:cursor-default py-3 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-500 focus-visible:outline-offset-2 rounded-lg px-2 -mx-2 transition-colors duration-300"
              onClick={() => onSelect && onSelect(item.name)}
            >
              <div className="flex flex-col pr-4 overflow-hidden flex-1 min-w-0">
                <span className="font-medium text-white text-sm mb-0.5 group-hover:text-neutral-200 transition-colors truncate block">
                  {item.name}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium truncate block">
                  {item.category || item.description || item.risk}
                </span>
              </div>
              <div className="text-right whitespace-nowrap pl-2 flex-shrink-0">
                <div className="text-sm text-white mb-0.5 font-medium">{item.price}</div>
                <div className={`text-xs font-medium ${item.change?.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                  {item.change}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
