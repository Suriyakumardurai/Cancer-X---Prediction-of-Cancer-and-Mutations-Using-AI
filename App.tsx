
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { LandingPage } from './components/LandingPage';
import { CasesPanel } from './components/CasesPanel';
import * as gemini from './services/geminiService';
import type { Case, NodeData, ChatMessage, DocumentAnalysis, ImageAnalysis } from './types';
import { v4 as uuidv4 } from 'uuid';

const SUPPORTED_DOC_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
const SUPPORTED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const NoCaseSelected: React.FC<{ onNewCase: () => void }> = ({ onNewCase }) => (
    <div className="flex-grow flex flex-col items-center justify-center text-center text-stone-500 p-4 sm:p-8 bg-white m-4 rounded-lg border border-stone-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 sm:w-24 sm:h-24 mb-6 text-teal-500/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625a1.875 1.875 0 0 0-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-700">Welcome to CancerX</h2>
        <p className="mt-2 max-w-lg text-sm sm:text-base">
            Select a case from the sidebar or create a new one to begin your analysis.
        </p>
        <button
            onClick={onNewCase}
            className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-teal-500"
        >
            Create New Case
        </button>
    </div>
);


const App: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isCasesPanelVisible, setIsCasesPanelVisible] = useState(true);
  
  const [activeFileId, setActiveFileId] = useState<string>('welcome');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  const activeCase = cases.find(c => c.id === activeCaseId) || null;
  const prevSynthesisStatusRef = useRef<Case['synthesisStatus'] | undefined>(undefined);

  useEffect(() => {
    if (showDashboard) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showDashboard]);
  
  const triggerSynthesis = useCallback(async (caseId: string) => {
    setCases(prevCases => {
        const targetCase = prevCases.find(c => c.id === caseId);
        if (!targetCase) return prevCases;

        const successfulNodes = targetCase.nodes.filter(n => n.status === 'success');
        
        if (targetCase.nodes.length === 0) {
           return prevCases.map(c => c.id === caseId ? { ...c, synthesisStatus: 'idle', synthesisReport: null, synthesizedNodeCount: 0 } : c);
        }

        if (successfulNodes.length === 0) {
            const report = "Could not generate a report as no files were successfully analyzed.";
            return prevCases.map(c => c.id === caseId ? { ...c, synthesisStatus: 'done', synthesisReport: report, synthesizedNodeCount: 0 } : c);
        }
        
        if (successfulNodes.length === targetCase.synthesizedNodeCount) {
            return prevCases;
        }

        const docAnalyses = successfulNodes.filter(n => n.type === 'doc').map(n => ({ ...n.result as DocumentAnalysis, fileName: n.file_name }));
        const imgAnalyses = successfulNodes.filter(n => n.type === 'img').map(n => ({ ...n.result as ImageAnalysis, fileName: n.file_name }));

        gemini.createMultiFileSynthesisReport(docAnalyses, imgAnalyses).then(report => {
            setCases(currentCases => currentCases.map(c => c.id === caseId ? {
                ...c,
                synthesisStatus: 'done',
                synthesisReport: report,
                synthesizedNodeCount: successfulNodes.length
            } : c));
        }).catch(err => {
            console.error("Synthesis failed:", err);
            setCases(currentCases => currentCases.map(c => c.id === caseId ? {
                ...c,
                synthesisStatus: 'done',
                synthesisReport: `Error: Synthesis failed. Please check the console for details.`,
            } : c));
        });

        return prevCases.map(c => c.id === caseId ? { ...c, synthesisStatus: 'loading' } : c);
    });
}, []);


  const handleNewCase = useCallback(() => {
    const caseCount = cases.length + 1;
    const newCase: Case = {
      id: uuidv4(),
      name: `Case ${caseCount}`,
      createdAt: Date.now(),
      nodes: [],
      synthesisReport: null,
      synthesisStatus: 'idle',
      chatHistory: [],
      synthesizedNodeCount: 0,
    };
    setCases(prev => [newCase, ...prev]);
    setActiveCaseId(newCase.id);
    setActiveFileId('welcome');
  }, [cases.length]);

  const handleDeleteCase = useCallback((caseId: string) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
    if (activeCaseId === caseId) {
      setActiveCaseId(null);
      setActiveFileId('welcome');
    }
  }, [activeCaseId]);
  
  const handleRenameCase = useCallback((caseId: string, newName: string) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, name: newName } : c));
  }, []);

  const handleSelectCase = useCallback((caseId: string) => {
    setActiveCaseId(caseId);
    setActiveFileId('welcome');
  }, []);


  const handleFileDrop = useCallback(async (droppedFiles: File[]) => {
    if (!activeCaseId) return;

    const validFiles = Array.from(droppedFiles).filter(f => 
      SUPPORTED_DOC_TYPES.includes(f.type) || SUPPORTED_IMG_TYPES.includes(f.type)
    );
    
    const newNodes: NodeData[] = validFiles.map(file => ({
        id: uuidv4(),
        file_name: file.name,
        mime_type: file.type,
        status: 'analyzing',
        type: SUPPORTED_DOC_TYPES.includes(file.type) ? 'doc' : 'img',
        file,
    }));
    
    if (newNodes.length === 0) return;

    setCases(prev => prev.map(c => c.id === activeCaseId ? { ...c, nodes: [...c.nodes, ...newNodes] } : c));
    setActiveFileId(newNodes[0].id);

    for (const node of newNodes) {
        try {
            const analysisFn = node.type === 'doc' ? gemini.analyzeDocument : gemini.analyzeImage;
            const result = await analysisFn(node.file!);
            
            if (node.type === 'doc' && !(result as DocumentAnalysis).isReportValid) {
                throw new Error((result as DocumentAnalysis).validityReasoning);
            }
            if (node.type === 'img' && !(result as ImageAnalysis).isScanValid) {
                 throw new Error((result as ImageAnalysis).validityReasoning);
            }

            setCases(prev => prev.map(c => c.id === activeCaseId ? {
                ...c,
                nodes: c.nodes.map(n => n.id === node.id ? { ...n, status: 'success', result } : n)
            } : c));
        } catch (err) {
            console.error(`Analysis failed for ${node.file_name}:`, err);
            let message = "Analysis failed due to an unexpected error.";
            if (err instanceof Error) {
                if (err.message.includes("quota") || err.message.includes("rate limit")) {
                    message = "Rate limit reached. Please wait a minute before uploading more files.";
                } else if (err.message.includes("invalid JSON")) {
                    message = "The AI model returned an unexpected format. Please try again.";
                } else {
                    message = `Analysis Error: ${err.message}. Check console for details.`;
                }
            }
            setCases(prev => prev.map(c => c.id === activeCaseId ? {
                ...c,
                nodes: c.nodes.map(n => n.id === node.id ? { ...n, status: 'error', error: message } : n)
            } : c));
        } finally {
            // Add a delay between processing each file to avoid hitting API rate limits.
            // Increased from 1.2s to 4.1s to respect the free tier limit (15 RPM).
            await new Promise(resolve => setTimeout(resolve, 4100));
        }
    }
    triggerSynthesis(activeCaseId);
  }, [activeCaseId, triggerSynthesis]);
  
  const handleDeleteNode = async (idToDelete: string) => {
     if (!activeCaseId) return;
     setCases(prev => prev.map(c => c.id === activeCaseId ? {
         ...c,
         nodes: c.nodes.filter(n => n.id !== idToDelete),
         // Reset synthesis count to force re-synthesis if needed
         synthesizedNodeCount: 0,
     } : c));
     if (activeFileId === idToDelete) {
        setActiveFileId('welcome');
     }
     triggerSynthesis(activeCaseId);
  };

  const handleSendMessage = async (message: string) => {
    if (isChatLoading || !activeCaseId || !activeCase) return;
    setIsChatLoading(true);

    const userMessage: ChatMessage = { role: 'user', content: message };
    
    // FIX: Use functional update to avoid race conditions with stale state.
    setCases(prevCases => {
        const currentCase = prevCases.find(c => c.id === activeCaseId);
        if (!currentCase) return prevCases;

        const updatedHistory: ChatMessage[] = [...currentCase.chatHistory, userMessage];

        gemini.askQuestion(
            {
                documentAnalyses: currentCase.nodes.filter(n => n.status === 'success' && n.type === 'doc').map(n => ({...n.result as DocumentAnalysis, fileName: n.file_name})),
                imageAnalyses: currentCase.nodes.filter(n => n.status === 'success' && n.type === 'img').map(n => ({...n.result as ImageAnalysis, fileName: n.file_name})),
                synthesisReport: currentCase.synthesisReport
            },
            updatedHistory,
            message
        ).then(responseContent => {
            const modelMessage: ChatMessage = { role: 'model', content: responseContent };
            setCases(finalCases => finalCases.map(c => c.id === activeCaseId ? { ...c, chatHistory: [...updatedHistory, modelMessage] } : c));
        }).catch(err => {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            const errorResponse: ChatMessage = { role: 'model', content: `Sorry, I encountered an error: ${errorMessage}` };
            setCases(finalCases => finalCases.map(c => c.id === activeCaseId ? { ...c, chatHistory: [...updatedHistory, errorResponse] } : c));
        }).finally(() => {
            setIsChatLoading(false);
        });

        return prevCases.map(c => c.id === activeCaseId ? { ...c, chatHistory: updatedHistory } : c);
    });
  };
  
  useEffect(() => {
    if (activeCase) {
      if (prevSynthesisStatusRef.current === 'loading' && activeCase.synthesisStatus === 'done') {
        setActiveFileId('synthesis');
      }
      prevSynthesisStatusRef.current = activeCase.synthesisStatus;
    }
  }, [activeCase]);

  if (!showDashboard) {
    return <LandingPage onLaunch={() => setShowDashboard(true)} />;
  }
  
  return (
    <div className="h-screen w-screen bg-[var(--bg-color)] text-stone-800 flex flex-col font-sans">
      <Header onNewCase={handleNewCase} onReturnHome={() => setShowDashboard(false)} />
      <main className="flex-grow flex min-h-0 relative">
        {isCasesPanelVisible && (
            <CasesPanel
              cases={cases}
              activeCaseId={activeCaseId}
              onSelectCase={handleSelectCase}
              onNewCase={handleNewCase}
              onDeleteCase={handleDeleteCase}
              onRenameCase={handleRenameCase}
              onClose={() => setIsCasesPanelVisible(false)}
            />
        )}
        
        {!isCasesPanelVisible && (
            <button
                onClick={() => setIsCasesPanelVisible(true)}
                className="absolute top-1/2 left-0 -translate-y-1/2 z-30 bg-white border border-l-0 border-stone-200 rounded-r-md p-2 shadow-md hover:bg-stone-100 transition-colors"
                aria-label="Show Cases Panel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
            </button>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {activeCase ? (
            <DiagnosticDashboard
              activeCase={activeCase}
              activeFileId={activeFileId}
              onFileSelect={setActiveFileId}
              onFileDrop={handleFileDrop}
              onDeleteNode={handleDeleteNode}
              isChatLoading={isChatLoading}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <NoCaseSelected onNewCase={handleNewCase} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
