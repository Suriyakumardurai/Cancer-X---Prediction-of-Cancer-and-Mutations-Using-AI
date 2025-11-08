
import React from 'react';
import type { User } from '../types';
import { ProfilePopover } from './ProfilePopover';

interface ApiKeySetupProps {
  user: User;
  onKeySelected: () => void;
  onLogout: () => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ user, onKeySelected, onLogout }) => {
  
  const handleSelectKey = async () => {
    // This function opens the AI Studio dialog.
    await window.aistudio.openSelectKey();
    // As per guidelines, assume success and notify the parent component.
    onKeySelected();
  };

  return (
    <div className="min-h-screen w-full font-sans flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="w-full max-w-5xl mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter">CancerX</h1>
        <ProfilePopover user={user} onLogout={onLogout} onShowProfile={() => {}} />
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="w-full max-w-xl">
          <div className="section-card p-8 sm:p-10 text-center">
            <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h2a2 2 0 012 2v4a2 2 0 01-2 2h-2m-6 4h6m-6-4H7a2 2 0 01-2-2V9a2 2 0 012-2h2m-6 4h.01M9 16h.01" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-color)]">Set Up Your API Key</h2>
            <p className="text-base text-[var(--text-muted-color)] mt-3">
              To use CancerX, you need to provide your own Google AI API key. Your key is used to make secure calls to the Gemini API and is not stored by this application.
            </p>
            <div className="mt-8">
              <button
                onClick={handleSelectKey}
                className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center py-3.5 px-8 border border-transparent rounded-xl shadow-sm text-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all transform hover:scale-105"
              >
                Select API Key
              </button>
            </div>
             <p className="text-xs text-slate-400 mt-6">
              By using this service, you agree to the Google AI API terms. For information on pricing and to enable billing for your project, please refer to the 
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline font-medium"> official billing documentation</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
