import React from 'react';
import type { User } from '../types';
import { ProfilePopover } from './ProfilePopover';

interface AppSelectionPageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: 'hub' | 'virtual_doctor') => void;
}

const SelectionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
  <div
    onClick={onClick}
    className="section-card group relative transition-all duration-300 cursor-pointer p-8 text-center flex flex-col items-center hover:shadow-2xl hover:shadow-teal-100 hover:-translate-y-2"
  >
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
    <div className="relative z-10 flex flex-col items-center flex-grow">
      <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-white">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-[var(--text-color)]">{title}</h3>
      <p className="text-base text-[var(--text-muted-color)] mt-3 flex-grow">{description}</p>
      <div className="mt-8 text-teal-600 font-semibold flex items-center group-hover:text-teal-700">
        Select Experience
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
);

export const AppSelectionPage: React.FC<AppSelectionPageProps> = ({ user, onLogout, onNavigate }) => {
  return (
    <div className="min-h-screen w-full font-sans flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in">
       <header className="w-full max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter">CancerX</h1>
        </div>
        <ProfilePopover user={user} onLogout={onLogout} />
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold text-slate-900 tracking-tighter">Welcome, {user.name.split(' ')[0]}</h2>
            <p className="text-xl text-slate-500 mt-4 max-w-2xl">Choose how you would like to proceed with your analysis.</p>
        </div>
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <SelectionCard
            title="Predictive Analysis"
            description="Analyze patient documents and medical scans to generate a unified synthesis report and chat with an AI assistant."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5v.214A2.25 2.25 0 0117.25 17h-10.5a2.25 2.25 0 01-2.25-2.25v-.214M19 14.5L14.25 10l-4.25-4.25" />
              </svg>
            }
            onClick={() => onNavigate('hub')}
          />
          <SelectionCard
            title="Virtual AI Doctor"
            description="Initiate an AI-powered phone call to discuss a specific patient case in a conversational format."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            }
            onClick={() => onNavigate('virtual_doctor')}
          />
        </div>
      </main>
    </div>
  );
};