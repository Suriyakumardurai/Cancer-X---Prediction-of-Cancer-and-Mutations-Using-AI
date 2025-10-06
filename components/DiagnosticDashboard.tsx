import React, { useState, useEffect } from 'react';
import type { NodeData } from '../App';
import type { ChatMessage, DocumentAnalysis, ImageAnalysis } from '../types';
import { CaseIntake } from './CaseIntake';
import { PatientSummary } from './PatientSummary';
import { ImageViewer } from './ImageViewer';
import { ReportView } from './ReportView';
import { Chat } from './Chat';

interface DiagnosticDashboardProps {
  nodes: NodeData[];
  activeFileId: string;
  onFileSelect: (id: string) => void;
  onFileDrop: (files: File[]) => void;
  onDeleteNode: (id: string) => void;
  synthesisReport: string | null;
  synthesisStatus: 'idle' | 'loading' | 'done';
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
}

const WelcomeScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 p-4 sm:p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 sm:w-24 sm:h-24 mb-6 text-teal-500/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-700">CancerX Analysis Environment</h2>
        <p className="mt-2 max-w-lg text-sm sm:text-base">
            To begin, upload patient documents or medical scans using the panel on the left.
            The AI will analyze each file, and once complete, generate a unified synthesis report.
        </p>
    </div>
);

const ViewerError: React.FC<{ node?: NodeData }> = ({ node }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 p-4 sm:p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 sm:w-20 sm:h-20 mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-800">Analysis Failed</h2>
        <p className="mt-2 max-w-md text-sm sm:text-base">{node?.error || 'An unknown error occurred during analysis. Please try a different file.'}</p>
    </div>
);

export const DiagnosticDashboard: React.FC<DiagnosticDashboardProps> = (props) => {
    const { nodes, activeFileId, onFileSelect, onFileDrop, onDeleteNode, synthesisReport, synthesisStatus, chatHistory, isChatLoading, onSendMessage } = props;

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'viewer' | 'chat'>('list');
    const activeFile = nodes.find(n => n.id === activeFileId);

    useEffect(() => {
        let objectUrl: string | null = null;
        if (activeFile?.type === 'img' && activeFile.file) {
            objectUrl = URL.createObjectURL(activeFile.file);
            setImageUrl(objectUrl);
        }
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                setImageUrl(null);
            }
        };
    }, [activeFile]);
    
    useEffect(() => {
        // If all files are deleted, go back to the list view on mobile
        if (nodes.length === 0) {
            setMobileView('list');
        }
    }, [nodes]);

    const handleFileSelection = (id: string) => {
        onFileSelect(id);
        setMobileView('viewer');
    };

    const handleBackToList = () => {
        setMobileView('list');
    };

    const handleOpenChat = () => setMobileView('chat');
    const handleCloseChat = () => setMobileView(activeFileId === 'welcome' || activeFileId === '' ? 'list' : 'viewer');


    const renderCentralPanel = () => {
        if (activeFileId === 'welcome') return <WelcomeScreen />;
        if (activeFileId === 'synthesis') {
            return synthesisReport 
                ? <ReportView report={synthesisReport} title="AI Synthesis Report" />
                : <p>Synthesis report is not available.</p>;
        }
        if (activeFile?.status === 'success') {
            if (activeFile.type === 'doc') return <PatientSummary data={activeFile.result as DocumentAnalysis} />;
            if (activeFile.type === 'img' && imageUrl) return <ImageViewer imageUrl={imageUrl} analysis={activeFile.result as ImageAnalysis} />;
        }
        if (activeFile?.status === 'error') return <ViewerError node={activeFile} />;
        if (activeFile?.status === 'analyzing') {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 p-8">
                     <svg className="w-16 h-16 animate-spin text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <p className="mt-4 text-lg">Analyzing {activeFile.file.name}...</p>
                </div>
            )
        }
        return <WelcomeScreen />;
    };

    return (
        <div className="w-full flex-grow p-2 sm:p-4 grid grid-cols-12 md:gap-4 relative">
            {/* Left Panel */}
            <div className={`col-span-12 md:col-span-3 section-card flex-col min-h-0 ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
                <CaseIntake 
                    nodes={nodes}
                    activeFileId={activeFileId}
                    onFileSelect={handleFileSelection}
                    onDrop={onFileDrop}
                    onDeleteNode={onDeleteNode}
                    synthesisStatus={synthesisStatus}
                />
            </div>

            {/* Center Panel */}
            <div className={`col-span-12 md:col-span-6 section-card flex-col overflow-hidden min-h-0 ${mobileView === 'viewer' ? 'flex' : 'hidden md:flex'}`}>
                <div className="flex-grow p-2 sm:p-6 overflow-y-auto light-scrollbar relative">
                  <button onClick={handleBackToList} className="md:hidden absolute top-3 left-3 z-10 p-2 rounded-full bg-stone-100/80 hover:bg-stone-200/80 backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {renderCentralPanel()}
                </div>
            </div>

            {/* Right Panel */}
            <div className={`col-span-12 md:col-span-3 section-card flex-col min-h-0 absolute md:static inset-0 z-20 bg-[var(--surface-color)] ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
                 <div className="p-4 border-b border-stone-200 flex-shrink-0 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-stone-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-teal-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>
                        AI Assistant
                    </h3>
                    <button onClick={handleCloseChat} className="md:hidden p-2 text-stone-500 hover:text-stone-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <Chat
                    messages={chatHistory}
                    onSendMessage={onSendMessage}
                    isLoading={isChatLoading}
                />
            </div>

            {/* Mobile Chat FAB */}
            <button 
                onClick={handleOpenChat}
                className={`md:hidden fixed bottom-6 right-6 z-10 p-4 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-transform transform active:scale-95 ${mobileView !== 'list' && mobileView !== 'viewer' ? 'hidden' : 'block'}`}
                aria-label="Open AI Assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>
            </button>
        </div>
    );
};