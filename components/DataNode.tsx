import React from 'react';
import type { NodeData } from '../App';

interface DataNodeProps {
  node: NodeData;
  onClick: () => void;
  position: { x: number; y: number };
  isSynthesis: boolean;
}

const getStatusStyles = (status: NodeData['status']) => {
  switch (status) {
    case 'analyzing':
      return {
        borderColor: 'border-cyan-500/50',
        textColor: 'text-cyan-400',
        icon: <Spinner />,
        label: 'Analyzing...'
      };
    case 'success':
      return {
        borderColor: 'border-fuchsia-500/50',
        textColor: 'text-fuchsia-400',
        icon: <CheckCircleIcon />,
        label: 'Success'
      };
    case 'error':
      return {
        borderColor: 'border-red-500/50',
        textColor: 'text-red-400',
        icon: <XCircleIcon />,
        label: 'Error'
      };
    default:
      return {
        borderColor: 'border-gray-600/50',
        textColor: 'text-gray-400',
        icon: null,
        label: 'Pending'
      };
  }
};

export const DataNode: React.FC<DataNodeProps> = ({ node, onClick, position, isSynthesis }) => {
  const styles = getStatusStyles(node.status);
  const sizeClass = isSynthesis ? 'w-32 h-32' : 'w-28 h-28';
  
  const content = isSynthesis ? (
      <>
        <SparklesIcon />
        <p className="font-bold">Synthesis</p>
      </>
  ) : (
      <>
        {node.type === 'doc' ? <FileTextIcon /> : <ImageIcon />}
        <p className="w-full text-xs truncate px-2">{node.file?.name}</p>
      </>
  );

  return (
    <div
      className={`absolute top-1/2 left-1/2 cursor-pointer group transition-transform duration-500 ease-in-out`}
      style={{ transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)` }}
      onClick={onClick}
    >
      <div className={`relative ${sizeClass} flex flex-col items-center justify-center text-center p-2 rounded-full bg-[var(--surface-color)] border backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-fuchsia-500 ${styles.borderColor}`}>
        <div className={`flex-grow flex flex-col items-center justify-center space-y-1 ${isSynthesis ? 'text-gray-100' : 'text-gray-300'}`}>
            {content}
        </div>
        <div className={`absolute -bottom-1 px-3 py-0.5 text-xs font-semibold rounded-full border bg-[var(--bg-color)] ${styles.borderColor} ${styles.textColor}`}>
            {styles.label}
        </div>
      </div>
    </div>
  );
};

// --- ICONS ---
const Spinner = () => <svg className="w-8 h-8 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const CheckCircleIcon = () => <svg className="w-8 h-8 text-fuchsia-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg className="w-8 h-8 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FileTextIcon = () => <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" /></svg>;
const ImageIcon = () => <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
const SparklesIcon = () => <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>;
