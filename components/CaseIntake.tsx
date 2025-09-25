import React from 'react';
import { FileUpload } from './FileUpload';
import type { NodeData } from '../App';

interface CaseIntakeProps {
  nodes: NodeData[];
  activeFileId: string;
  onFileSelect: (id: string) => void;
  onDrop: (files: File[]) => void;
  onDeleteNode: (id: string) => void;
  synthesisStatus: 'idle' | 'loading' | 'done';
}

const getStatusIcon = (status: NodeData['status']) => {
  switch (status) {
    case 'analyzing':
      return <svg className="w-5 h-5 animate-spin text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
    case 'success':
      return <svg className="w-5 h-5 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'error':
      return <svg className="w-5 h-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
      return null;
  }
};

const FileIcon: React.FC<{type: 'doc' | 'img'}> = ({ type }) => {
    if (type === 'doc') {
        return <svg className="w-5 h-5 text-stone-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" /></svg>;
    }
    return <svg className="w-5 h-5 text-stone-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
};

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const CaseIntake: React.FC<CaseIntakeProps> = ({ nodes, activeFileId, onFileSelect, onDrop, onDeleteNode, synthesisStatus }) => {
  return (
    <>
      <div className="p-4 border-b border-stone-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-stone-700">Case Files</h3>
      </div>
      <div className="p-4 flex-shrink-0">
        <FileUpload onDrop={onDrop} />
      </div>
      <div className="flex-grow p-4 pt-0 overflow-y-auto light-scrollbar">
        <ul className="space-y-2">
            {synthesisStatus !== 'idle' && (
                <li>
                     <button
                        onClick={() => onFileSelect('synthesis')}
                        disabled={synthesisStatus !== 'done'}
                        className={`w-full flex items-center space-x-3 text-left p-2.5 rounded-lg transition-colors duration-200 ${activeFileId === 'synthesis' ? 'bg-teal-100 text-teal-800' : 'hover:bg-stone-100'} ${synthesisStatus !== 'done' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            {synthesisStatus === 'loading' ? getStatusIcon('analyzing') : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-teal-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>}
                        </span>
                        <span className="flex-1 text-sm font-semibold truncate">
                            AI Synthesis Report
                        </span>
                    </button>
                </li>
            )}
          {nodes.map(node => (
            <li key={node.id} className="group relative">
              <button
                onClick={() => onFileSelect(node.id)}
                className={`w-full flex items-center space-x-3 text-left p-2.5 rounded-lg transition-colors duration-200 ${activeFileId === node.id ? 'bg-teal-100 text-teal-800' : 'hover:bg-stone-100'}`}
              >
                <span className="flex-shrink-0"><FileIcon type={node.type} /></span>
                <span className={`flex-1 text-sm truncate ${activeFileId === node.id ? 'text-teal-800' : 'text-stone-600'}`}>{node.file.name}</span>
                <span className="flex-shrink-0 w-5 h-5">{getStatusIcon(node.status)}</span>
              </button>
               <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Delete ${node.file.name}`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};