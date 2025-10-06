
import React, { useState, useRef, useEffect } from 'react';
import type { Case } from '../App';

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
    <div className="bg-white/80 backdrop-blur-sm border border-stone-200 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div onClick={onSelect} className="flex-grow p-6 cursor-pointer">
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
            className="w-full text-lg font-bold bg-stone-100 border border-teal-500 rounded-md p-1 -m-1 focus:outline-none"
          />
        ) : (
          <h3 className="text-lg font-bold text-stone-800 truncate">{caseData.name}</h3>
        )}
        <p className="text-sm text-stone-500 mt-1">{new Date(caseData.createdAt).toLocaleDateString()}</p>
        <div className="mt-4 flex items-center space-x-4 text-sm text-stone-600">
          <div className="flex items-center space-x-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" /></svg>
            <span>{docCount} Docs</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>{imgCount} Scans</span>
          </div>
        </div>
      </div>
      <div className="border-t border-stone-200/80 p-2 flex justify-end items-center space-x-1">
          <button onClick={() => setIsEditing(true)} className="p-2 rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors" aria-label="Rename case">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
          </button>
          <button onClick={onDelete} className="p-2 rounded-md text-stone-500 hover:bg-red-100 hover:text-red-600 transition-colors" aria-label="Delete case">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </button>
      </div>
    </div>
  );
};


export const CaseHub: React.FC<{
  cases: Case[];
  onSelectCase: (id: string) => void;
  onNewCase: () => void;
  onDeleteCase: (id: string) => void;
  onRenameCase: (id: string, newName: string) => void;
}> = ({ cases, onSelectCase, onNewCase, onDeleteCase, onRenameCase }) => {
  return (
    <div className="min-h-screen w-full bg-[var(--bg-color)] text-[var(--text-color)] font-sans antialiased p-4 sm:p-6 lg:p-8">
      <header className="max-w-screen-xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-teal-800">Case Hub</h1>
        <p className="text-lg text-stone-500 mt-2">Select a case to analyze or create a new one to begin.</p>
      </header>
      <main className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <button onClick={onNewCase} className="border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-teal-500 hover:text-teal-600 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                <span className="font-semibold">New Case</span>
            </button>
            
            {cases.map(c => (
                <CaseCard 
                    key={c.id} 
                    caseData={c}
                    onSelect={() => onSelectCase(c.id)}
                    onDelete={() => onDeleteCase(c.id)}
                    onRename={(newName) => onRenameCase(c.id, newName)}
                />
            ))}
        </div>
      </main>
    </div>
  );
};
