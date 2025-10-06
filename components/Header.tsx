import React from 'react';

export const Header: React.FC<{onReset: () => void; onReturnHome: () => void}> = ({ onReset, onReturnHome }) => {
  return (
    <header className="absolute w-full top-0 left-0 z-50 flex-shrink-0 bg-white/80 backdrop-blur-lg shadow-sm border-b border-stone-200">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <button onClick={onReturnHome} className="text-2xl font-bold text-teal-800 hover:text-teal-600 transition-colors">
          CancerX
        </button>
        <button 
            onClick={onReset} 
            className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-teal-500"
        >
            New Analysis
        </button>
      </div>
    </header>
  );
};