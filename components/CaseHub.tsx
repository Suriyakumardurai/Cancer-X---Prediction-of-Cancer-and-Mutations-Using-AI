
import React, { useState, useRef, useEffect } from 'react';
import type { Case, User } from '../types';
import { ProfilePopover } from './ProfilePopover';

const CaseCard: React.FC<{
  caseData: Case;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}> = ({ caseData, onSelect, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(caseData.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (name.trim()) {
      onRename(name.trim());
    } else {
      setName(caseData.name);
    }
    setIsEditing(false);
  };

  const docCount = caseData.nodes.filter(n => n.type === 'doc').length;
  const imgCount = caseData.nodes.filter(n => n.type === 'img').length;

  return (
    <div className="section-card group flex flex-col hover:shadow-xl hover:-translate-y-1 relative overflow-hidden transition-all duration-300">
      <div 
        className="absolute top-0 left-0 w-full h-1 bg-teal-500/0 group-hover:bg-teal-500/100 transition-all duration-300"
      ></div>
      <div onClick={onSelect} className="flex-grow p-6 cursor-pointer z-10">
        {isEditing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="w-full text-xl font-bold text-[var(--text-color)] bg-slate-100 border border-teal-500 rounded-lg p-2 -m-2 focus:outline-none"
          />
        ) : (
          <h3 className="text-xl font-bold text-[var(--text-color)] truncate" title={caseData.name}>{caseData.name}</h3>
        )}
        <p className="text-sm text-[var(--text-muted-color)] mt-1">ID: {caseData.id} &bull; Created: {new Date(caseData.createdAt).toLocaleDateString()}</p>
        <div className="mt-6 flex items-center space-x-6 text-sm text-[var(--text-muted-color)]">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" /></svg>
            <span className="font-medium text-[var(--text-color)]">{docCount} {docCount === 1 ? 'Doc' : 'Docs'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-medium text-[var(--text-color)]">{imgCount} {imgCount === 1 ? 'Scan' : 'Scans'}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 p-2 flex justify-end items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button onClick={() => setIsEditing(true)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" aria-label="Rename case">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2-2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors" aria-label="Delete case">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </button>
      </div>
    </div>
  );
};


export const CaseHub: React.FC<{
  cases: Case[];
  user: User;
  onSelectCase: (id: string) => void;
  onNewCase: () => void;
  onDeleteCase: (id: string) => void;
  onRenameCase: (id: string, newName: string) => void;
  onBack: () => void;
  onLogout: () => void;
  onShowProfile: () => void;
}> = ({ cases, user, onSelectCase, onNewCase, onDeleteCase, onRenameCase, onBack, onLogout, onShowProfile }) => {
  return (
    <div className="min-h-screen w-full font-sans antialiased animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6 lg:py-8">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Back to App Selection
            </button>
            <header className="mt-4 mb-12 flex justify-between items-center">
                <div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tighter">Welcome, {user.name.split(' ')[0]}</h1>
                    <p className="text-xl text-slate-500 mt-3">Select a patient case to view or create a new one.</p>
                </div>
                 <div className="flex items-center gap-4">
                    <button
                    onClick={onNewCase}
                    className="flex items-center justify-center py-3 px-6 text-base font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-teal-200"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Case
                    </button>
                    <ProfilePopover user={user} onLogout={onLogout} onShowProfile={onShowProfile} />
                </div>
            </header>
        </div>
      
        {cases.length > 0 ? (
            <div className="pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cases.map(c => (
                    <CaseCard 
                        key={c.id} 
                        caseData={c}
                        onSelect={() => onSelectCase(c.id)}
                        onDelete={() => {
                            if (window.confirm(`Are you sure you want to delete "${c.name}"? This action cannot be undone.`)) {
                                onDeleteCase(c.id);
                            }
                        }}
                        onRename={(newName) => onRenameCase(c.id, newName)}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                <h3 className="mt-4 text-2xl font-semibold text-slate-800">No cases found</h3>
                <p className="mt-2 text-base text-slate-500">Get started by creating your first case.</p>
            </div>
        )}
      </div>
    </div>
  );
};