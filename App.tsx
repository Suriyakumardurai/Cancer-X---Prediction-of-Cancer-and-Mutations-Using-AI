
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { CaseHub } from './components/CaseHub';
import { analyzeDocument, analyzeImage, createMultiFileSynthesisReport, askQuestion } from './services/geminiService';
import type { DocumentAnalysis, ImageAnalysis, AnalysisResult, ChatMessage, User } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { LoginPage } from './components/LoginPage';
import { generateUniqueCode } from './utils/codeGenerator';

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
  dataUrl?: string;
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

interface AppData {
    users: User[];
    cases: Record<string, Case[]>; // Keyed by user ID
}

// --- Data Persistence Helpers ---

const getAppData = (): AppData => {
    try {
        const data = window.localStorage.getItem('cancerx_data');
        return data ? JSON.parse(data) : { users: [], cases: {} };
    } catch (error) {
        console.error("Error reading app data from localStorage", error);
        return { users: [], cases: {} };
    }
};

const saveAppData = (data: AppData) => {
    try {
        const serializableData = {
            ...data,
            cases: Object.fromEntries(
                Object.entries(data.cases).map(([userId, userCases]) => [
                    userId,
                    userCases.map(c => ({
                        ...c,
                        nodes: c.nodes.map(({ file, ...rest }) => ({
                            ...rest,
                            file: { name: file.name, type: file.type }
                        }))
                    }))
                ])
            )
        };
        window.localStorage.setItem('cancerx_data', JSON.stringify(serializableData));
    } catch (error) {
        console.error("Error saving app data to localStorage", error);
    }
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid data URL');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

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

  const [cases, setCases] = useState<Case[]>([]);
  const [view, setView] = useState<'hub' | 'dashboard'>('hub');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>('welcome');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  
  const activeCase = cases.find(c => c.id === activeCaseId);

  useEffect(() => {
    if (currentUser) {
        const userCases = appData.cases[currentUser.id] || [];
        const rehydratedCases = userCases.map(c => ({
            ...c,
            nodes: c.nodes.map((n: any) => {
                const file = n.dataUrl
                    ? dataURLtoFile(n.dataUrl, n.file.name)
                    : new File([], n.file.name, { type: n.file.type });
                return { ...n, file };
            })
        }));
        setCases(rehydratedCases);
        
        // Only reset the view when the user *changes*, not just when data updates.
        if (view !== 'hub' || activeCaseId !== null) {
            setView('hub');
            setActiveCaseId(null);
        }
    } else {
        setCases([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Separate effect to keep cases in sync with appData after the initial load
  useEffect(() => {
      if (currentUser) {
          const userCases = appData.cases[currentUser.id] || [];
          const rehydratedCases = userCases.map(c => ({
              ...c,
              nodes: c.nodes.map((n: any) => {
                  const file = n.dataUrl
                      ? dataURLtoFile(n.dataUrl, n.file.name)
                      : new File([], n.file.name, { type: n.file.type });
                  return { ...n, file };
              })
          }));
          setCases(rehydratedCases);
      }
  }, [appData, currentUser]);


  useEffect(() => {
    if (view === 'dashboard' && !activeCase) {
      setView('hub');
    }
  }, [view, activeCase]);

  const updateAppData = (updater: (data: AppData) => AppData) => {
    const newData = updater(getAppData());
    saveAppData(newData);
    setAppData(newData);
  };

  const handleRegister = (name: string, email: string, pass: string): User | { error: string } => {
    let userToReturn: User | null = null;
    let error: string | null = null;

    updateAppData(data => {
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
    const data = getAppData();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
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

    let newCase: Case | null = null;
    updateAppData(data => {
        const allCaseIds = Object.values(data.cases).flat().map(c => c.id);
        const userCases = data.cases[currentUser.id] || [];
        const caseNumbers = userCases.map(c => {
            const match = c.name.match(/^Case (\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        });
        const nextCaseNumber = Math.max(0, ...caseNumbers) + 1;

        newCase = {
            id: generateUniqueCode(allCaseIds),
            name: `Case ${nextCaseNumber}`,
            createdAt: Date.now(),
            nodes: [],
            synthesisReport: null,
            synthesisStatus: 'idle',
            synthesizedNodeCount: 0,
            chatHistory: [],
        };

        const newCasesForUser = [...userCases, newCase];
        return { ...data, cases: { ...data.cases, [currentUser.id]: newCasesForUser } };
    });

    if (newCase) {
        setActiveCaseId(newCase.id);
        setActiveFileId('welcome');
        setView('dashboard');
    }
  }, [currentUser]);

  const updateActiveCase = useCallback((updater: (currentCase: Case) => Case) => {
    if (!currentUser) return;
    updateAppData(data => {
        const userCases = data.cases[currentUser.id] || [];
        const newCases = userCases.map(c =>
          c.id === activeCaseId ? updater(c) : c
        );
        return { ...data, cases: { ...data.cases, [currentUser.id]: newCases } };
    });
  }, [activeCaseId, currentUser]);
  
  const handleDeleteCase = (idToDelete: string) => {
    if (!currentUser) return;
    
    // 1. Calculate the new cases array based on the current 'cases' state.
    const newCasesForUser = cases.filter(c => c.id !== idToDelete);

    // 2. Update the local 'cases' state for immediate UI feedback.
    setCases(newCasesForUser);

    // 3. Update the master 'appData' source of truth and persist to localStorage.
    updateAppData(currentData => {
        // We use the full currentData from storage but overwrite the cases for the current user.
        return {
            ...currentData,
            cases: {
                ...currentData.cases,
                [currentUser.id]: newCasesForUser
            }
        };
    });

    // 4. Reset view if the currently active case was deleted.
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
    updateAppData(data => {
        const userCases = data.cases[currentUser.id] || [];
        const newCases = userCases.map(c =>
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
                        cases={cases}
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
            // Fallback for when dashboard is the view but no active case is selected (e.g., after deletion)
            return <CaseHub cases={cases} onSelectCase={handleSelectCase} onNewCase={handleNewCase} onDeleteCase={handleDeleteCase} onRenameCase={handleRenameCase} user={currentUser} />;
        default:
             return <CaseHub cases={cases} onSelectCase={handleSelectCase} onNewCase={handleNewCase} onDeleteCase={handleDeleteCase} onRenameCase={handleRenameCase} user={currentUser} />;
    }
  }

  return renderContent();
};

export default App;
