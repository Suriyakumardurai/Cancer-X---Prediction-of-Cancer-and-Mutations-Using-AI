
import React, { useState, useRef, useEffect } from 'react';
import type { Case, User } from '../types';
import { ProfilePopover } from './ProfilePopover';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeCase?: Case;
  cases: Case[];
  onSelectCase: (id: string) => void;
  onNewCase: () => void;
  onRenameCase: (id: string, newName: string) => void;
  onShowHub: () => void;
  onReset: () => void;
  onDeleteCase: (id: string) => void;
  onShowProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, activeCase, cases, onSelectCase, onNewCase, onShowHub, onReset, onDeleteCase, onShowProfile }) => {
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
    <header className="absolute w-full top-0 left-0 z-50 flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
            <button 
                onClick={onShowHub} 
                className="p-3 rounded-xl text-[var(--text-muted-color)] hover:bg-slate-200/60 hover:text-[var(--text-color)] transition-colors"
                aria-label="Back to Case Hub"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2"></div>

            <div ref={switcherRef} className="relative">
                <button onClick={() => setIsSwitcherOpen(p => !p)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-slate-200/60 transition-colors">
                    <span className="text-xl font-bold text-[var(--text-color)]">{activeCase.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[var(--text-muted-color)] transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>

                {isSwitcherOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-fade-in-up">
                        <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Switch Case</p>
                        <div className="max-h-60 overflow-y-auto light-scrollbar px-1">
                            {cases.filter(c => c.id !== activeCase.id).map(c => (
                                <button key={c.id} onClick={() => { onSelectCase(c.id); setIsSwitcherOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--text-color)] hover:bg-teal-50 hover:text-teal-800 rounded-lg transition-colors">
                                    {c.name}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-slate-200 my-2"></div>
                        <button onClick={() => { onNewCase(); setIsSwitcherOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm font-medium text-[var(--text-color)] hover:bg-teal-50 hover:text-teal-800 transition-colors rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            <span>New Case</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onReset} 
                className="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-100 rounded-xl hover:bg-rose-200 transition-colors"
            >
                Clear Case
            </button>
            <button 
                onClick={() => {
                    if (window.confirm(`Are you sure you want to permanently delete "${activeCase.name}"? This action cannot be undone.`)) {
                        onDeleteCase(activeCase.id);
                    }
                }}
                className="px-4 py-2 text-sm font-semibold text-rose-600 bg-transparent border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
            >
                Delete Case
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            <ProfilePopover user={user} onLogout={onLogout} onShowProfile={onShowProfile} />
        </div>
      </div>
    </header>
  );
};
