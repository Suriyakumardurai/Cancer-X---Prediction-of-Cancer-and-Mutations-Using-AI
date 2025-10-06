
import React, { useState, useRef, useEffect } from 'react';
import type { Case } from '../App';

interface HeaderProps {
  activeCase?: Case;
  cases: Case[];
  onSelectCase: (id: string) => void;
  onNewCase: () => void;
  onRenameCase: (id: string, newName: string) => void;
  onShowHub: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeCase, cases, onSelectCase, onNewCase, onShowHub, onReset }) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeCase) return null;

  return (
    <header className="absolute w-full top-0 left-0 z-50 flex-shrink-0 bg-white/80 backdrop-blur-lg shadow-sm border-b border-stone-200">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button 
                onClick={onShowHub} 
                className="p-2 rounded-md text-stone-600 hover:bg-stone-200/80 hover:text-stone-800 transition-colors"
                aria-label="Back to Case Hub"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            <div className="w-px h-6 bg-stone-200"></div>

            <div ref={switcherRef} className="relative">
                <button onClick={() => setIsSwitcherOpen(p => !p)} className="flex items-center gap-2 p-2 rounded-md hover:bg-stone-200/80 transition-colors">
                    <span className="text-xl font-bold text-teal-800">{activeCase.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-stone-500 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>

                {isSwitcherOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-stone-200 rounded-lg shadow-xl z-50 py-2">
                        <p className="px-4 py-1 text-xs font-semibold text-stone-400 uppercase">Switch Case</p>
                        <div className="max-h-60 overflow-y-auto light-scrollbar px-2 py-1">
                            {cases.filter(c => c.id !== activeCase.id).map(c => (
                                <button key={c.id} onClick={() => { onSelectCase(c.id); setIsSwitcherOpen(false); }} className="w-full text-left px-2 py-1.5 text-sm text-stone-600 hover:bg-teal-50 hover:text-teal-800 rounded-md transition-colors">
                                    {c.name}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-stone-200 my-2"></div>
                        <button onClick={() => { onNewCase(); setIsSwitcherOpen(false); }} className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-stone-600 hover:bg-teal-50 hover:text-teal-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            <span>New Case</span>
                        </button>
                    </div>
                )}
            </div>
        </div>

        <button 
            onClick={onReset} 
            className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-teal-500"
        >
            Clear Case
        </button>
      </div>
    </header>
  );
};
