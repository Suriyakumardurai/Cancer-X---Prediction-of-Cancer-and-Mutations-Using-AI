
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { NodeData, ChatMessage, DocumentAnalysis, ImageAnalysis, SynthesisReportData } from '../types';
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
  synthesisReport: SynthesisReportData | null;
  synthesisStatus: 'idle' | 'loading' | 'done';
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
}

const useWindowSize = () => {
    const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
    useEffect(() => {
        const handleResize = () => {
            setSize([window.innerWidth, window.innerHeight]);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return size;
};

const ResizableHandle: React.FC<{ onMouseDown: (event: React.MouseEvent) => void }> = ({ onMouseDown }) => (
    <div
        className="w-2.5 bg-transparent cursor-col-resize transition-colors duration-200 flex-shrink-0 group"
        onMouseDown={onMouseDown}
        role="separator"
        aria-orientation="vertical"
    >
        <div className="w-0.5 h-full bg-[var(--border-color)] group-hover:bg-[var(--accent-color)] mx-auto transition-colors duration-300"></div>
    </div>
);

const WelcomeScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 sm:w-32 sm:h-32 mb-8 text-teal-500/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-color)] tracking-tighter">Analysis Environment</h2>
        <p className="mt-6 max-w-xl text-base sm:text-lg text-[var(--text-muted-color)] leading-relaxed">
            To begin, upload patient documents or medical scans using the panel on the left.
            The AI will analyze each file, and once complete, generate a unified synthesis report.
        </p>
    </div>
);

const ViewerError: React.FC<{ node?: NodeData }> = ({ node }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 sm:w-24 sm:h-24 mb-6 text-rose-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-color)]">Analysis Failed</h2>
        <p className="mt-4 max-w-lg text-base sm:text-lg text-[var(--text-muted-color)]">{node?.error || 'An unknown error occurred during analysis. Please try a different file.'}</p>
    </div>
);

export const DiagnosticDashboard: React.FC<DiagnosticDashboardProps> = (props) => {
    const { nodes, activeFileId, onFileSelect, onFileDrop, onDeleteNode, synthesisReport, synthesisStatus, chatHistory, isChatLoading, onSendMessage } = props;

    const [mobileView, setMobileView] = useState<'list' | 'viewer' | 'chat'>('list');
    
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [dividers, setDividers] = useState([25, 75]);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef<number | null>(null);
    const [width] = useWindowSize();
    const isDesktop = width >= 768;

    const activeFile = nodes.find(n => n.id === activeFileId);

    const handleMouseDown = (dividerIndex: number) => (event: React.MouseEvent) => {
        event.preventDefault();
        isResizing.current = dividerIndex;
        document.body.style.cursor = 'col-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (isResizing.current === null || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const position = ((event.clientX - containerRect.left) / containerRect.width) * 100;
        const minWidth = 20;

        setDividers(prev => {
            const newDividers = [...prev];
            if (isResizing.current === 0) {
                const maxPos = isChatVisible ? prev[1] - minWidth : 100 - minWidth;
                newDividers[0] = Math.max(minWidth, Math.min(position, maxPos));
            } else if (isResizing.current === 1) {
                const minPos = prev[0] + minWidth;
                newDividers[1] = Math.max(minPos, Math.min(position, 100 - minWidth));
            }
            return newDividers;
        });
    }, [isChatVisible]);

    const handleMouseUp = useCallback(() => {
        isResizing.current = null;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    useEffect(() => {
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    const toggleChat = () => setIsChatVisible(prev => !prev);
    
    useEffect(() => {
        if (nodes.length === 0) {
            setMobileView('list');
        }
    }, [nodes]);

    const handleFileSelection = (id: string) => {
        onFileSelect(id);
        setMobileView('viewer');
    };

    const handleBackToList = () => setMobileView('list');
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
            if (activeFile.type === 'img' && activeFile.dataUrl) return <ImageViewer imageUrl={activeFile.dataUrl} analysis={activeFile.result as ImageAnalysis} />;
        }
        if (activeFile?.status === 'error') return <ViewerError node={activeFile} />;
        if (activeFile?.status === 'analyzing') {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                     <svg className="w-24 h-24 animate-spin text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <p className="mt-8 text-xl text-[var(--text-color)] font-medium">Analyzing {activeFile.file.name}...</p>
                </div>
            )
        }
        return <WelcomeScreen />;
    };
    
    const handleWidthPx = 10;
    const numHandles = isChatVisible ? 2 : 1;
    const totalHandleWidthPx = numHandles * handleWidthPx;

    const leftWidthPercent = dividers[0];
    const centerWidthPercent = isChatVisible ? dividers[1] - dividers[0] : 100 - dividers[0];
    const rightWidthPercent = isChatVisible ? 100 - dividers[1] : 0;
    
    const getPanelStyle = (percentage: number) => isDesktop ? {
        flex: `0 0 calc(${percentage}% - ${totalHandleWidthPx * (percentage / 100)}px)`
    } : undefined;


    return (
        <div ref={containerRef} className="w-full h-full p-4 sm:p-6 flex relative">
            {/* Left Panel */}
            <div
                style={getPanelStyle(leftWidthPercent)}
                className={`section-card flex-col min-h-0 ${mobileView === 'list' ? 'flex w-full' : 'hidden md:flex'}`}
            >
                <CaseIntake 
                    nodes={nodes}
                    activeFileId={activeFileId}
                    onFileSelect={handleFileSelection}
                    onDrop={onFileDrop}
                    onDeleteNode={onDeleteNode}
                    synthesisStatus={synthesisStatus}
                />
            </div>

            {/* First Divider */}
            {isDesktop && <ResizableHandle onMouseDown={handleMouseDown(0)} />}


            {/* Center Panel */}
            <div
                style={getPanelStyle(centerWidthPercent)}
                className={`section-card flex-col overflow-hidden min-h-0 ${mobileView === 'viewer' ? 'flex w-full' : 'hidden md:flex'}`}
            >
                <div className="flex-grow p-4 sm:p-8 overflow-y-auto light-scrollbar relative">
                  <button onClick={handleBackToList} className="md:hidden absolute top-4 left-4 z-10 p-2 rounded-full bg-white/80 hover:bg-slate-100 backdrop-blur-sm border border-[var(--border-color)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-muted-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {renderCentralPanel()}
                </div>
            </div>

            {/* Right Panel and Divider (Conditional) */}
            {isChatVisible && isDesktop && <ResizableHandle onMouseDown={handleMouseDown(1)} />}
            {isChatVisible && (
                 <div
                    style={getPanelStyle(rightWidthPercent)}
                    className={`section-card flex-col min-h-0 ${mobileView === 'chat' ? 'absolute inset-0 z-20 flex bg-[var(--surface-color)]' : 'hidden md:flex'}`}
                >
                    <div className="p-4 border-b border-[var(--border-color)] flex-shrink-0 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2 text-teal-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>
                            AI Assistant
                        </h3>
                        <button onClick={handleCloseChat} className="md:hidden p-2 text-slate-500 hover:text-slate-800" aria-label="Close chat">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button onClick={toggleChat} className="hidden md:block p-2 text-slate-500 hover:text-slate-800" aria-label="Hide panel">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <Chat
                        messages={chatHistory}
                        onSendMessage={onSendMessage}
                        isLoading={isChatLoading}
                    />
                </div>
            )}


            {/* Mobile Chat FAB */}
            <button 
                onClick={handleOpenChat}
                className={`md:hidden fixed bottom-6 right-6 z-10 p-4 bg-teal-600 text-white rounded-3xl shadow-lg hover:bg-teal-700 transition-transform transform active:scale-95 ${mobileView !== 'list' && mobileView !== 'viewer' ? 'hidden' : 'block'}`}
                aria-label="Open AI Assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>
            </button>

             {/* Desktop Show Chat Button */}
            <button
                onClick={toggleChat}
                className={`hidden md:flex items-center justify-center fixed bottom-6 right-6 z-10 p-4 bg-teal-600 text-white rounded-3xl shadow-lg hover:bg-teal-700 transition-all transform active:scale-95 ${isChatVisible ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                aria-label="Show AI Assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>
            </button>
        </div>
    );
};