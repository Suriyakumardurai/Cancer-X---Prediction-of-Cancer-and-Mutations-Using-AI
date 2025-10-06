
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { CaseHub } from './components/CaseHub';
import { analyzeDocument, analyzeImage, createMultiFileSynthesisReport, askQuestion } from './services/geminiService';
import type { DocumentAnalysis, ImageAnalysis, AnalysisResult, ChatMessage } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { LandingPage } from './components/LandingPage';

const SUPPORTED_DOC_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
const SUPPORTED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export type NodeStatus = 'pending' | 'analyzing' | 'success' | 'error';
export interface NodeData {
  id: string;
  file: File;
  status: NodeStatus;
  result?: DocumentAnalysis | ImageAnalysis;
  error?: string;
  type: 'doc' | 'img';
}

export interface Case {
  id: string;
  name: string;
  createdAt: number;
  nodes: NodeData[];
  synthesisReport: string | null;
  synthesisStatus: 'idle' | 'loading' | 'done';
  synthesizedNodeCount: number;
  chatHistory: ChatMessage[];
}

// Helper function to force-save state to the database (localStorage)
const saveCasesToStorage = (casesToSave: Case[]) => {
    try {
        const serializableCases = casesToSave.map(c => ({
            ...c,
            // Convert File objects to a serializable format for storage
            nodes: c.nodes.map(({ file, ...rest }) => ({ ...rest, file: { name: file.name, type: file.type } }))
        }));
        window.localStorage.setItem('cancerx_cases', JSON.stringify(serializableCases));
    } catch (error) {
        console.error("Error saving cases to localStorage", error);
    }
};


const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'hub' | 'dashboard'>('landing');
  const [cases, setCases] = useState<Case[]>(() => {
    try {
      const savedCases = window.localStorage.getItem('cancerx_cases');
      if (savedCases) {
        const parsedCases = JSON.parse(savedCases);
        // Rehydrate File objects which are not serializable
        return parsedCases.map((c: Case) => ({ ...c, nodes: c.nodes.map(n => ({...n, file: new File([], n.file.name, {type: n.file.type})})) }));
      }
    } catch (error) {
      console.error("Error reading cases from localStorage", error);
    }
    return [];
  });
  
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>('welcome');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  const activeCase = cases.find(c => c.id === activeCaseId);

  // This effect ensures that if we are in the dashboard view without an
  // active case (e.g., after deletion), we are safely redirected to the hub.
  useEffect(() => {
    if (view === 'dashboard' && !activeCase) {
      setView('hub');
    }
  }, [view, activeCase]);

  const handleNewCase = useCallback(() => {
      const newCaseId = crypto.randomUUID();
      const caseNumbers = cases.map(c => {
          const match = c.name.match(/^Case (\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
      });
      const nextCaseNumber = Math.max(0, ...caseNumbers) + 1;
      const newCase: Case = {
          id: newCaseId,
          name: `Case ${nextCaseNumber}`,
          createdAt: Date.now(),
          nodes: [],
          synthesisReport: null,
          synthesisStatus: 'idle',
          synthesizedNodeCount: 0,
          chatHistory: [],
      };
      
      const newCases = [...cases, newCase];
      saveCasesToStorage(newCases);
      setCases(newCases);
      
      setActiveCaseId(newCaseId);
      setActiveFileId('welcome');
      setView('dashboard');
  }, [cases]);

  const updateActiveCase = useCallback((updater: (currentCase: Case) => Case) => {
    const newCases = cases.map(c => 
        c.id === activeCaseId ? updater(c) : c
    );
    saveCasesToStorage(newCases);
    setCases(newCases);
  }, [activeCaseId, cases]);

  const handleDeleteCase = (idToDelete: string) => {
    // This is a direct, imperative implementation to guarantee deletion.
    // 1. Calculate the new state.
    const newCases = cases.filter(c => c.id !== idToDelete);
    
    // 2. Force-save the new state to the database immediately.
    saveCasesToStorage(newCases);
    
    // 3. Update the React state to reflect the change in the UI.
    setCases(newCases);
    
    // 4. If the active case was deleted, clear the active ID.
    // The useEffect will handle redirecting to the hub.
    if (activeCaseId === idToDelete) {
        setActiveCaseId(null);
    }
  };
  
  const handleSelectCase = (id: string) => {
    setActiveCaseId(id);
    setActiveFileId('welcome');
    setView('dashboard');
  };
  
  const handleShowHub = () => {
    setActiveCaseId(null);
    setActiveFileId('welcome');
    setView('hub');
  };

  const handleRenameCase = (idToRename: string, newName: string) => {
    const newCases = cases.map(c =>
        c.id === idToRename ? { ...c, name: newName.trim() } : c
    );
    saveCasesToStorage(newCases);
    setCases(newCases);
  };

  const handleReset = () => {
    if (!activeCaseId) return;
    updateActiveCase(c => ({
        ...c,
        nodes: [],
        synthesisReport: null,
        synthesisStatus: 'idle',
        synthesizedNodeCount: 0,
        chatHistory: [],
    }));
    setActiveFileId('welcome');
  };

  const processFile = useCallback(async (file: File) => {
    if (!activeCaseId) return;
    const id = `${file.name}-${file.size}-${Date.now()}`;
    const type = SUPPORTED_DOC_TYPES.includes(file.type) ? 'doc' : 'img';
    
    updateActiveCase(c => ({
      ...c,
      nodes: [...c.nodes, { id, file, status: 'analyzing', type }]
    }));
    setActiveFileId(id);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      let result;
      if (type === 'doc') {
        result = await analyzeDocument(base64, mimeType);
        if (!result.isReportValid) throw new Error(result.validityReasoning);
      } else {
        result = await analyzeImage(base64, mimeType);
        if (!result.isScanValid) throw new Error(result.validityReasoning);
      }

      updateActiveCase(c => ({ ...c, nodes: c.nodes.map(n => n.id === id ? { ...n, status: 'success', result: {...result, fileName: file.name} } : n)}));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      updateActiveCase(c => ({ ...c, nodes: c.nodes.map(n => n.id === id ? { ...n, status: 'error', error: reason } : n)}));
    }
  }, [activeCaseId, updateActiveCase]);

  const handleFileDrop = useCallback((droppedFiles: File[]) => {
    const filesToProcess = Array.from(droppedFiles).filter(f => 
      SUPPORTED_DOC_TYPES.includes(f.type) || SUPPORTED_IMG_TYPES.includes(f.type)
    );
    if (!filesToProcess.length) return;

    if (!activeCaseId) {
        handleNewCase();
        // Note: Due to async state, we can't immediately process. 
        // A robust solution would queue files, but for now, this creates the case.
        return;
    }
    filesToProcess.forEach(processFile);
  }, [activeCaseId, handleNewCase, processFile]);
  
  const handleDeleteNode = (idToDelete: string) => {
    updateActiveCase(c => ({
        ...c,
        nodes: c.nodes.filter(n => n.id !== idToDelete)
    }));
    if (activeFileId === idToDelete) {
      const currentCase = cases.find(c => c.id === activeCaseId);
      if (currentCase && currentCase.synthesisStatus !== 'idle') {
        setActiveFileId('synthesis');
      } else {
        setActiveFileId('welcome');
      }
    }
  };

  useEffect(() => {
    if (!activeCase) return;

    const successfulNodes = activeCase.nodes.filter(n => n.status === 'success');
    const isProcessing = activeCase.nodes.some(n => n.status === 'analyzing');

    if (isProcessing) return;

    if (successfulNodes.length === 0) {
      if (activeCase.synthesisStatus !== 'idle') {
        updateActiveCase(c => ({...c, synthesisReport: null, synthesisStatus: 'idle', synthesizedNodeCount: 0}));
        if (activeFileId === 'synthesis') {
            setActiveFileId('welcome');
        }
      }
      return;
    }

    if (successfulNodes.length !== activeCase.synthesizedNodeCount) {
      const generateSynthesis = async () => {
        updateActiveCase(c => ({...c, synthesisStatus: 'loading', synthesizedNodeCount: successfulNodes.length}));

        const successfulDocAnalyses = successfulNodes.filter(n => n.type === 'doc').map(n => n.result as DocumentAnalysis);
        const successfulImgAnalyses = successfulNodes.filter(n => n.type === 'img').map(n => n.result as ImageAnalysis);
        
        const report = await createMultiFileSynthesisReport(successfulDocAnalyses, successfulImgAnalyses);
        updateActiveCase(c => ({...c, synthesisReport: report, synthesisStatus: 'done'}));
        setActiveFileId('synthesis');
      };
      generateSynthesis();
    }
  }, [activeCase, activeFileId, updateActiveCase]);

  const handleSendMessage = async (message: string) => {
    if (isChatLoading || !activeCase) return;
    
    const successfulDocAnalyses = activeCase.nodes.filter(n => n.type === 'doc' && n.status === 'success').map(n => n.result as DocumentAnalysis);
    const successfulImgAnalyses = activeCase.nodes.filter(n => n.type === 'img' && n.status === 'success').map(n => n.result as ImageAnalysis);
    
    const analysisResult: AnalysisResult = {
        documentAnalyses: successfulDocAnalyses,
        imageAnalyses: successfulImgAnalyses,
        synthesisReport: activeCase.synthesisReport || undefined,
        imageUrls: {},
    };

    const newHistory: ChatMessage[] = [...activeCase.chatHistory, { role: 'user', content: message }];
    updateActiveCase(c => ({...c, chatHistory: newHistory}));
    setIsChatLoading(true);

    try {
        const response = await askQuestion(analysisResult, newHistory, message);
        updateActiveCase(c => ({...c, chatHistory: [...newHistory, { role: 'model', content: response }]}));
    } catch (err) {
        const errorContent = err instanceof Error ? err.message : "Sorry, I couldn't get a response.";
        updateActiveCase(c => ({...c, chatHistory: [...newHistory, { role: 'model', content: `**Error:** ${errorContent}` }]}));
    } finally {
        setIsChatLoading(false);
    }
  };

  const handleStart = () => {
    if (cases.length > 0) {
        setView('hub');
    } else {
        handleNewCase();
    }
  };

  const renderContent = () => {
    switch (view) {
        case 'landing':
            return <LandingPage onStart={handleStart} />;
        case 'hub':
            return <CaseHub 
                        cases={cases}
                        onSelectCase={handleSelectCase}
                        onNewCase={handleNewCase}
                        onDeleteCase={handleDeleteCase}
                        onRenameCase={handleRenameCase}
                    />;
        case 'dashboard':
            if (activeCase) {
                return (
                     <div className="h-screen w-screen bg-[var(--bg-color)] text-stone-800 flex flex-col font-sans">
                      <Header 
                        activeCase={activeCase}
                        cases={cases}
                        onSelectCase={handleSelectCase}
                        onNewCase={handleNewCase}
                        onRenameCase={handleRenameCase}
                        onShowHub={handleShowHub}
                        onReset={handleReset}
                      />
                      <main className="flex-grow pt-[64px] flex min-h-0">
                          <div className="flex-grow min-w-0 h-full">
                            <DiagnosticDashboard
                              key={activeCase.id}
                              nodes={activeCase.nodes}
                              activeFileId={activeFileId}
                              onFileSelect={setActiveFileId}
                              onFileDrop={handleFileDrop}
                              onDeleteNode={handleDeleteNode}
                              synthesisReport={activeCase.synthesisReport}
                              synthesisStatus={activeCase.synthesisStatus}
                              chatHistory={activeCase.chatHistory}
                              isChatLoading={isChatLoading}
                              onSendMessage={handleSendMessage}
                            />
                          </div>
                      </main>
                    </div>
                );
            }
            return null;
        default:
            return <LandingPage onStart={handleStart} />;
    }
  }

  return renderContent();
};

export default App;
