import React, { useState, useRef, useEffect } from 'react';
import type { Case } from '../types';

interface CasesPanelProps {
  cases: Case[];
  activeCaseId: string | null;
  onSelectCase: (id: string) => void;
  onNewCase: () => void;
  onDeleteCase: (id: string) => void;
  onRenameCase: (id: string, newName: string) => void;
  onClose: () => void;
}

export const CasesPanel: React.FC<CasesPanelProps> = ({ cases, activeCaseId, onSelectCase, onNewCase, onDeleteCase, onRenameCase, onClose }) => {
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingCaseId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCaseId]);

    const handleStartEditing = (caseItem: Case) => {
        setEditingCaseId(caseItem.id);
        setEditingName(caseItem.name);
    };

    const handleFinishEditing = () => {
        if (editingCaseId && editingName.trim()) {
            onRenameCase(editingCaseId, editingName.trim());
        }
        setEditingCaseId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleFinishEditing();
        } else if (e.key === 'Escape') {
            setEditingCaseId(null);
        }
    };

    return (
        <div className="w-64 bg-stone-50 border-r border-stone-200 flex flex-col flex-shrink-0 h-full">
            <div className="p-4 border-b border-stone-200 flex-shrink-0 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-stone-700">My Cases</h3>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={onNewCase}
                        className="p-2 text-teal-600 rounded-md hover:bg-teal-100 hover:text-teal-700 transition-colors"
                        aria-label="Create new case"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-500 rounded-md hover:bg-stone-200/60 hover:text-stone-800 transition-colors"
                        aria-label="Hide Cases Panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex-grow p-2 overflow-y-auto light-scrollbar">
                {cases.length === 0 ? (
                     <div className="text-center text-stone-400 pt-8 px-4">
                        <p className="text-sm">Click the '+' icon to start your first analysis case.</p>
                    </div>
                ) : (
                    <ul className="space-y-1">
                    {cases.map(caseItem => (
                        <li key={caseItem.id} className="group">
                           <div className={`w-full flex items-center text-left p-2.5 rounded-lg transition-colors duration-200 relative ${activeCaseId === caseItem.id ? 'bg-teal-100 text-teal-800' : 'hover:bg-stone-200/50'}`}>
                                <button onClick={() => onSelectCase(caseItem.id)} className="flex-1 flex items-center space-x-3 truncate">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                                    {editingCaseId === caseItem.id ? (
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onBlur={handleFinishEditing}
                                            onKeyDown={handleKeyDown}
                                            className="w-full bg-white border border-teal-500 rounded px-1 py-0 text-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="flex flex-col flex-1 truncate">
                                            <span className="text-sm font-medium truncate">{caseItem.name}</span>
                                            <span className="text-xs text-stone-400 group-hover:text-stone-500">{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </button>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingCaseId !== caseItem.id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleStartEditing(caseItem); }}
                                            className="p-1 rounded-md text-stone-500 hover:bg-stone-300/50 hover:text-stone-700"
                                            aria-label={`Rename ${caseItem.name}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L13.196 5.196z" /></svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteCase(caseItem.id); }}
                                        className="p-1 rounded-md text-stone-500 hover:bg-red-100 hover:text-red-600"
                                        aria-label={`Delete ${caseItem.name}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                           </div>
                        </li>
                    ))}
                    </ul>
                )}
            </div>
        </div>
    );
};