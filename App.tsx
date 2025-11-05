
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { CaseHub } from './components/CaseHub';
import { analyzeDocument, analyzeImage, createMultiFileSynthesisReport, askQuestion } from './services/geminiService';
import type { DocumentAnalysis, ImageAnalysis, AnalysisResult, ChatMessage, User, Case, AppData, NodeData } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { LoginPage } from './components/LoginPage';
import { generateUniqueCode } from './utils/codeGenerator';
import { getAppData, saveAppData } from './utils/storageUtils';

const SUPPORTED_DOC_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
const SUPPORTED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


// --- App Component ---

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>(getAppData);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const userId = window.sessionStorage.getItem('cancerx_user');
      if (userId) {
          const data = getAppData();
          return data.users.find(u => u.id === userId) || null;
      }
      return null;
  });

  const [view, setView] = useState<'hub' | 'dashboard'>('hub');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>('welcome');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  
  const userCases = currentUser ? appData.cases[currentUser.id] || [] : [];
  const activeCase = userCases.find(c => c.id === activeCaseId);
  
  // This effect automatically saves any changes in appData to local storage.
  useEffect(() => {
      saveAppData(appData);
  }, [appData]);

  useEffect(() => {
    if (currentUser && (view !== 'hub' || activeCaseId !== null)) {
        setView('hub');
        setActiveCaseId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (view === 'dashboard' && !activeCase) {
      setView('hub');
    }
  }, [view, activeCase]);

  const handleRegister = (name: string, email: string, pass: string): User | { error: string } => {
    let userToReturn: User | null = null;
    let error: string | null = null;

    setAppData(data => {
        if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            error = "An account with this email already exists.";
            return data;
        }
        const allUserIds = data.users.map(u => u.id);
        const newUser: User = { 
            id: generateUniqueCode(allUserIds), 
            name, 
            email, 
            password: pass // Note: In a real app, hash this password!
        };
        userToReturn = newUser;
        return { ...data, users: [...data.users, newUser] };
    });

    if (error) return { error };
    return userToReturn!;
  };

  const handleLogin = (email: string, pass: string): User | { error: string } => {
    const user = appData.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      window.sessionStorage.setItem('cancerx_user', user.id);
      setCurrentUser(user);
      return user;
    }
    return { error: 'Invalid email or password.' };
  };

  const handleLogout = () => {
      window.sessionStorage.removeItem('cancerx_user');
      setCurrentUser(null);
  };
  
  const handleNewCase = useCallback(() => {
    if (!currentUser) return;
    let newCaseId: string | null = null;

    setAppData(data => {
        const allCaseIds = Object.values(data.cases).flat().map(c => c.id);
        const currentUserCases = data.cases[currentUser.id] || [];
        const caseNumbers = currentUserCases.map(c => {
            const match = c.name.match(/^Case (\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        });
        const nextCaseNumber = Math.max(0, ...caseNumbers) + 1;

        const newCase: Case = {
            id: generateUniqueCode(allCaseIds),
            name: `Case ${nextCaseNumber}`,
            createdAt: Date.now(),
            nodes: [],
            synthesisReport: null,
            synthesisStatus: 'idle',
            synthesizedNodeCount: 0,
            chatHistory: [],
        };
        newCaseId = newCase.id;

        const newCasesForUser = [...currentUserCases, newCase];
        return { ...data, cases: { ...data.cases, [currentUser.id]: newCasesForUser } };
    });

    setTimeout(() => {
        if (newCaseId) {
            setActiveCaseId(newCaseId);
            setActiveFileId('welcome');
            setView('dashboard');
        }
    }, 0);
  }, [currentUser]);

  const updateActiveCase = useCallback((updater: (currentCase: Case) => Case) => {
    if (!currentUser) return;
    setAppData(data => {
        const currentUserCases = data.cases[currentUser.id] || [];
        const newCases = currentUserCases.map(c =>
          c.id === activeCaseId ? updater(c) : c
        );
        return { ...data, cases: { ...data.cases, [currentUser.id]: newCases } };
    });
  }, [activeCaseId, currentUser]);
  
  const handleDeleteCase = (idToDelete: string) => {
    if (!currentUser) return;

    // As requested, perform the delete operation 3 times to ensure it is "deadly forcefully" applied.
    for (let i = 0; i < 3; i++) {
        setAppData(prevAppData => {
            const userCases = prevAppData.cases[currentUser.id] || [];
            if (!userCases.some(c => c.id === idToDelete)) {
                return prevAppData;
            }
            const newCasesForUser = userCases.filter(c => c.id !== idToDelete);
            return {
                ...prevAppData,
                cases: {
                    ...prevAppData.cases,
                    [currentUser.id]: newCasesForUser
                }
            };
        });
    }

    if (activeCaseId === idToDelete) {
        setActiveCaseId(null);
        setView('hub');
    }
  };
  
  const handleSelectCase = (id: string) => {
    setFileQueue([]);
    setActiveCaseId(id);
    setActiveFileId('welcome');
    setView('dashboard');
  };
  
  const handleShowHub = () => {
    setFileQueue([]);
    setActiveCaseId(null);
    setActiveFileId('welcome');
    setView('hub');
  };

  const handleRenameCase = (idToRename: string, newName: string) => {
    if (!currentUser) return;
    setAppData(data => {
        const currentUserCases = data.cases[currentUser.id] || [];
        const newCases = currentUserCases.map(c =>
            c.id === idToRename ? { ...c, name: newName.trim() } : c
        );
        return { ...data, cases: { ...data.cases, [currentUser.id]: newCases } };
    });
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
    const { base64, mimeType } = await fileToBase64(file);
    const dataUrl = type === 'img' ? `data:${mimeType};base64,${base64}` : undefined;
    
    const newNode: NodeData = { id, file, status: 'analyzing', type, dataUrl };
    
    updateActiveCase(c => ({ ...c, nodes: [...c.nodes, newNode] }));
    setActiveFileId(id);

    try {
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
  
  useEffect(() => {
    if (activeCaseId && fileQueue.length > 0) {
      fileQueue.forEach(processFile);
      setFileQueue([]);
    }
  }, [activeCaseId, fileQueue, processFile]);

  const handleFileDrop = useCallback((droppedFiles: File[]) => {
    const filesToProcess = Array.from(droppedFiles).filter(f => 
      SUPPORTED_DOC_TYPES.includes(f.type) || SUPPORTED_IMG_TYPES.includes(f.type)
    );
    if (!filesToProcess.length) return;

    if (!activeCaseId) {
        handleNewCase();
    }
    setFileQueue(q => [...q, ...filesToProcess]);
  }, [activeCaseId, handleNewCase]);
  
  const handleDeleteNode = (idToDelete: string) => {
    updateActiveCase(c => ({ ...c, nodes: c.nodes.filter(n => n.id !== idToDelete) }));
    if (activeFileId === idToDelete) {
      setActiveFileId(activeCase && activeCase.synthesisStatus !== 'idle' ? 'synthesis' : 'welcome');
    }
  };

  useEffect(() => {
    if (!activeCase) return;
    const successfulNodes = activeCase.nodes.filter(n => n.status === 'success');
    if (successfulNodes.length > 0 && successfulNodes.length !== activeCase.synthesizedNodeCount && !activeCase.nodes.some(n => n.status === 'analyzing')) {
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
  }, [activeCase, updateActiveCase]);

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

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const renderContent = () => {
    switch (view) {
        case 'hub':
            return <CaseHub 
                        cases={userCases}
                        onSelectCase={handleSelectCase}
                        onNewCase={handleNewCase}
                        onDeleteCase={handleDeleteCase}
                        onRenameCase={handleRenameCase}
                        user={currentUser}
                    />;
        case 'dashboard':
            if (activeCase) {
                return (
                     <div className="h-screen w-screen bg-[var(--bg-color)] text-stone-800 flex flex-col font-sans">
                      <Header 
                        user={currentUser}
                        onLogout={handleLogout}
                        activeCase={activeCase}
                        cases={userCases}
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
            // Fallback for when dashboard is the view but no active case is selected (e.g., after deletion)
            return <CaseHub cases={userCases} onSelectCase={handleSelectCase} onNewCase={handleNewCase} onDeleteCase={handleDeleteCase} onRenameCase={handleRenameCase} user={currentUser} />;
        default:
             return <CaseHub cases={userCases} onSelectCase={handleSelectCase} onNewCase={handleNewCase} onDeleteCase={handleDeleteCase} onRenameCase={handleRenameCase} user={currentUser} />;
    }
  }

  return renderContent();
};

export default App;
