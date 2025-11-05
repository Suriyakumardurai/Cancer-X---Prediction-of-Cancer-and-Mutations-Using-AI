
import React, { useState, useRef, useEffect } from 'react';
// FIX: The 'Case' type is exported from '../types', not '../App'.
import type { Case } from '../types';

interface CasesPanelProps {
  cases: Case[];
  activeCaseId: string | null;
  onSelectCase: (id: string) => void;
  onNewCase: () => void;
  onDeleteCase: (id: string) => void;
  onRenameCase: (id: string, newName: string) => void;
}

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CasesPanel: React.FC<CasesPanelProps> = ({ cases, activeCaseId, onSelectCase, onNewCase, onDeleteCase, onRenameCase }) => {
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCaseId && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingCaseId]);
  
  const handleSaveRename = () => {
    if (editingCaseId && editingName.trim()) {
      onRenameCase(editingCaseId, editingName.trim());
    }
    setEditingCaseId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleSaveRename();
    } else if (e.key === 'Escape') {
        setEditingCaseId(null);
    }
  };

  return (
    <div className="h-full bg-stone-100/50 border-r border-stone-200 flex flex-col w-64 flex-shrink-0 transition-all duration-300">
      <div className="p-4 border-b border-stone-200 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-stone-700">My Cases</h2>
      </div>
      <div className="p-4 flex-shrink-0">
        <button
          onClick={onNewCase}
          className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-100 focus:ring-teal-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Case
        </button>
      </div>
      <div className="flex-grow p-4 pt-0 overflow-y-auto light-scrollbar">
        {cases.length > 0 ? (
          <ul className="space-y-2">
            {cases.map(c => (
              <li key={c.id} className="group relative">
                {editingCaseId === c.id ? (
                    <div className="p-2.5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleSaveRename}
                            onKeyDown={handleRenameKeyDown}
                            className="w-full text-sm font-semibold bg-white border border-teal-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => onSelectCase(c.id)}
                        onDoubleClick={() => {
                            setEditingCaseId(c.id);
                            setEditingName(c.name);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors duration-200 ${
                        c.id === activeCaseId
                            ? 'bg-teal-100 text-teal-800'
                            : 'text-stone-600 hover:bg-stone-200'
                        }`}
                    >
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className="text-xs opacity-70 mt-1">
                        {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                    </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${c.name}"?`)) {
                        onDeleteCase(c.id);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete ${c.name}`}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-stone-500 text-sm mt-8">
            <p>No cases yet.</p>
            <p>Click "New Case" to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};