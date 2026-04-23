

import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { CaseHub } from './components/CaseHub';
import { analyzeDocument, analyzeImage, createMultiFileSynthesisReport, askQuestion } from './services/geminiService';
import type { DocumentAnalysis, ImageAnalysis, AnalysisResult, ChatMessage, User, Case, AppData, NodeData, SynthesisReportData } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { LoginPage } from './components/LoginPage';
import { generateUniqueCode } from './utils/codeGenerator';
import { getAppData, saveAppData, getApiKey, saveApiKey, removeApiKey } from './utils/storageUtils';
import { AppSelectionPage } from './components/AppSelectionPage';

import { ApiKeySetup } from './components/ApiKeySetup';
import { ProfilePage } from './components/ProfilePage';

const SUPPORTED_DOC_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
const SUPPORTED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


// --- App Component ---

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>(getAppData);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const userId = window.sessionStorage.getItem('cancerx_user');
      if (userId) {
          const data = getAppData(); // Use initial data load for this
          return data.users.find(u => u.id === userId) || null;
      }
      return null;
  });

  const [view, setView] = useState<'hub' | 'dashboard' | 'selection' | 'profile'>('selection');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>('welcome');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(getApiKey);
  
  // Data persistence
  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const userCases = currentUser ? appData.cases.filter(c => c.userId === currentUser.id && c.isVisible) : [];
  const activeCase = activeCaseId && currentUser ? appData.cases.find(c => c.id === activeCaseId && c.userId === currentUser.id) : null;
  
  useEffect(() => {
    if (currentUser && apiKey && view !== 'hub' && view !== 'dashboard' && view !== 'profile') {
        setView('selection');
    }
  }, [currentUser, apiKey, view]);

  // Effect to handle navigation when the active case is deleted/invalidated.
  // This is a declarative approach: the UI "reacts" to the state of the data.
  useEffect(() => {
    // If the active case exists in state but its `isVisible` flag is false (i.e., it has been "soft-deleted"),
    // then we must navigate the user away from the dashboard for that case.
    if (activeCase && !activeCase.isVisible) {
      setActiveCaseId(null);
      setView('hub');
      setActiveFileId('welcome');
      setFileQueue([]);
    }
  }, [activeCase]);

  // API call wrapper for error handling
  const withApiKeyCheck = async <T,>(apiCall: (apiKey: string) => Promise<T>): Promise<T> => {
    if (!apiKey) {
      console.error("Attempted to make API call without an API key.");
      throw new Error("API Key is not set. Please configure it in your profile.");
    }
    try {
      return await apiCall(apiKey);
    } catch (e) {
      if (e instanceof Error && e.message.includes("API key not valid")) {
        console.error("API key error, clearing key and prompting user.");
        removeApiKey();
        setApiKey(null); // This will trigger the ApiKeySetup screen
      }
      throw e; // Re-throw the error to be handled by the original caller's catch block
    }
  };

  // --- Data Manipulation Callbacks ---
  
  const addUser = useCallback((newUser: User) => {
    setAppData(prev => ({ ...prev, users: [...prev.users, newUser] }));
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setAppData(prev => ({ ...prev, users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u) }));
  }, []);

  const addCase = useCallback((newCase: Case) => {
    setAppData(prev => ({ ...prev, cases: [...prev.cases, newCase] }));
  }, []);
  
  const updateCase = useCallback((caseId: string, updater: (currentCase: Case) => Case) => {
    setAppData(prev => ({ ...prev, cases: prev.cases.map(c => (c.id === caseId ? updater(c) : c)) }));
  }, []);

  const renameCase = useCallback((caseId: string, newName: string) => {
    updateCase(caseId, c => ({ ...c, name: newName.trim() }));
  }, [updateCase]);

  const handleDeleteCase = useCallback((idToDelete: string) => {
    // This function is now only responsible for updating the data state.
    // The UI navigation is handled declaratively by a useEffect hook.
    setAppData(prevAppData => ({
      ...prevAppData,
      cases: prevAppData.cases.map(c =>
        c.id === idToDelete ? { ...c, isVisible: false } : c
      ),
    }));
  }, []);


  // --- Event Handlers ---

  const handleRegister = (name: string, email: string, pass: string): void | { error: string } => {
    if (appData.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { error: "An account with this email already exists." };
    }
    
    const allUserIds = appData.users.map(u => u.id);
    const newUser: User = { 
        id: generateUniqueCode(allUserIds), 
        name, 
        email, 
        password: pass
    };
    
    addUser(newUser);
    
    window.sessionStorage.setItem('cancerx_user', newUser.id);
    setCurrentUser(newUser);
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

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    updateUser(updatedUser);
  };

  const handleShowProfile = () => {
    setView('profile');
  };

  const handleBackToApp = () => {
    setView('selection');
  }

  const handleSetApiKey = (key: string) => {
    saveApiKey(key);
    setApiKey(key);
  };

  const handleClearApiKey = () => {
    removeApiKey();
    setApiKey(null);
  };
  
  const handleNewCase = useCallback(() => {
    if (!currentUser) return;

    const allCaseIds = appData.cases.map(c => c.id);
    const currentUserCases = appData.cases.filter(c => c.userId === currentUser.id);
    const caseNumbers = currentUserCases.map(c => {
        const match = c.name.match(/^Case (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    });
    const nextCaseNumber = Math.max(0, ...caseNumbers) + 1;

    const newCase: Case = {
        id: generateUniqueCode(allCaseIds),
        userId: currentUser.id,
        name: `Case ${nextCaseNumber}`,
        createdAt: Date.now(),
        nodes: [],
        synthesisReport: null,
        synthesisStatus: 'idle',
        synthesizedNodeCount: 0,
        chatHistory: [],
        isVisible: true,
    };
    
    addCase(newCase);

    setTimeout(() => {
        setActiveCaseId(newCase.id);
        setActiveFileId('welcome');
        setView('dashboard');
    }, 0);
  }, [currentUser, appData.cases, addCase]);

  const updateActiveCase = useCallback((updater: (currentCase: Case) => Case) => {
    if (!currentUser || !activeCaseId) return;
    updateCase(activeCaseId, updater);
  }, [activeCaseId, currentUser, updateCase]);
  
  const handleSelectCase = (id: string) => {
    setFileQueue([]);
    setActiveCaseId(id);
    setActiveFileId('welcome');
    setView('dashboard');
  };
  
  const handleShowHub = useCallback(() => {
    setFileQueue([]);
    setActiveCaseId(null);
    setActiveFileId('welcome');
    setView('hub');
  }, []);
  
  const handleRenameCase = (idToRename: string, newName: string) => {
    if (!currentUser) return;
    renameCase(idToRename, newName);
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
        result = await withApiKeyCheck((key) => analyzeDocument(base64, mimeType, key));
        if (!result.isReportValid) throw new Error(result.validityReasoning);
      } else {
        result = await withApiKeyCheck((key) => analyzeImage(base64, mimeType, key));
        if (!result.isScanValid) throw new Error(result.validityReasoning);
      }
      updateActiveCase(c => ({ ...c, nodes: c.nodes.map(n => n.id === id ? { ...n, status: 'success', result: {...result, fileName: file.name} } : n)}));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      updateActiveCase(c => ({ ...c, nodes: c.nodes.map(n => n.id === id ? { ...n, status: 'error', error: reason } : n)}));
    }
  }, [activeCaseId, updateActiveCase, withApiKeyCheck]);
  
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
        try {
            const report = await withApiKeyCheck((key) => createMultiFileSynthesisReport(successfulDocAnalyses, successfulImgAnalyses, key));
            updateActiveCase(c => ({...c, synthesisReport: report, synthesisStatus: 'done'}));
            setActiveFileId('synthesis');
        } catch(error) {
            console.error("Synthesis failed:", error);
            updateActiveCase(c => ({...c, synthesisStatus: 'idle', synthesizedNodeCount: 0 })); // Reset on failure
        }
      };
      generateSynthesis();
    }
  }, [activeCase, updateActiveCase, withApiKeyCheck]);

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
        const response = await withApiKeyCheck((key) => askQuestion(analysisResult, newHistory, message, key));
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

  if (!apiKey) {
    return <ApiKeySetup user={currentUser} onLogout={handleLogout} onSetApiKey={handleSetApiKey} />;
  }

  const renderContent = () => {
    switch (view) {
        case 'profile':
            return <ProfilePage user={currentUser} apiKey={apiKey} onLogout={handleLogout} onBack={handleBackToApp} onUpdateUser={handleUpdateUser} onUpdateApiKey={handleSetApiKey} onClearApiKey={handleClearApiKey} />;
        case 'selection':
            return <AppSelectionPage user={currentUser} onLogout={handleLogout} onNavigate={setView} onShowProfile={handleShowProfile} />;
        case 'hub':
            return <CaseHub 
                        cases={userCases}
                        onSelectCase={handleSelectCase}
                        onNewCase={handleNewCase}
                        onDeleteCase={handleDeleteCase}
                        onRenameCase={handleRenameCase}
                        user={currentUser}
                        onBack={() => setView('selection')}
                        onLogout={handleLogout}
                        onShowProfile={handleShowProfile}
                    />;
        case 'dashboard':
            if (activeCase) {
                return (
                     <div className="h-screen w-screen flex flex-col font-sans">
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
                        onDeleteCase={handleDeleteCase}
                        onShowProfile={handleShowProfile}
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
            return <CaseHub cases={userCases} onSelectCase={handleSelectCase} onNewCase={handleNewCase} onDeleteCase={handleDeleteCase} onRenameCase={handleRenameCase} user={currentUser} onBack={() => setView('selection')} onLogout={handleLogout} onShowProfile={handleShowProfile} />;
        default:
             return <AppSelectionPage user={currentUser} onLogout={handleLogout} onNavigate={setView} onShowProfile={handleShowProfile} />;
    }
  }

  return renderContent();
};

export default App;