
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { CaseHub } from './components/CaseHub';
import { analyzeDocument, analyzeImage, createMultiFileSynthesisReport, askQuestion } from './services/geminiService';
import type { DocumentAnalysis, ImageAnalysis, AnalysisResult, ChatMessage, User, Case, AppData, NodeData, SynthesisReportData } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { LoginPage } from './components/LoginPage';
import { generateUniqueCode } from './utils/codeGenerator';
import { getAppData, saveAppData } from './utils/storageUtils';
import { AppSelectionPage } from './components/AppSelectionPage';
import { VirtualDoctorPage } from './components/VirtualDoctorPage';
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
          const data = getAppData();
          return data.users.find(u => u.id === userId) || null;
      }
      return null;
  });

  const [view, setView] = useState<'hub' | 'dashboard' | 'selection' | 'virtual_doctor' | 'profile'>('selection');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>('welcome');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  
  const userCases = currentUser ? appData.cases[currentUser.id] || [] : [];
  const activeCase = userCases.find(c => c.id === activeCaseId);
  
  // This effect automatically saves any changes in appData to local storage.
  useEffect(() => {
      saveAppData(appData);
  }, [appData]);

  useEffect(() => {
    const checkApiKey = async () => {
        if (currentUser) {
            // Check if a key has been selected in this session.
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeyReady(hasKey);
            if (hasKey && view !== 'hub' && view !== 'dashboard' && view !== 'virtual_doctor' && view !== 'profile') {
                setView('selection');
            }
        } else {
            // If no user, no key is ready.
            setApiKeyReady(false);
        }
    };
    checkApiKey();
  }, [currentUser]); // Run when user logs in/out


  useEffect(() => {
    if (view === 'dashboard' && !activeCase) {
      setView('hub');
    }
  }, [view, activeCase]);

  // API call wrapper for error handling
  const withApiKeyCheck = async <T,>(apiCall: () => Promise<T>): Promise<T> => {
    try {
      return await apiCall();
    } catch (e) {
      if (e instanceof Error && (e.message.includes("API key not valid") || e.message.includes("Requested entity was not found."))) {
        console.error("API key error, prompting user to re-select.");
        setApiKeyReady(false); // This will trigger the ApiKeySetup screen
      }
      throw e; // Re-throw the error to be handled by the original caller's catch block
    }
  };


  const handleRegister = (name: string, email: string, pass: string): void | { error: string } => {
    // Synchronously check for existing user to provide immediate feedback
    if (appData.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { error: "An account with this email already exists." };
    }
    
    const allUserIds = appData.users.map(u => u.id);
    const newUser: User = { 
        id: generateUniqueCode(allUserIds), 
        name, 
        email, 
        password: pass // Note: In a real app, hash this password!
    };
    
    // Update state with new user
    setAppData(prevData => ({
        ...prevData,
        users: [...prevData.users, newUser],
        cases: { ...prevData.cases, [newUser.id]: [] } // Initialize cases for new user
    }));
    
    // Automatically log in the new user
    window.sessionStorage.setItem('cancerx_user', newUser.id);
    setCurrentUser(newUser);
    // The useEffect listening for currentUser changes will handle setting the view.
  };

  const handleLogin = (email: string, pass: string): User | { error: string } => {
    const user = appData.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      window.sessionStorage.setItem('cancerx_user', user.id);
      setCurrentUser(user);
      // Let the useEffect handle view change based on API key status
      return user;
    }
    return { error: 'Invalid email or password.' };
  };

  const handleLogout = () => {
      window.sessionStorage.removeItem('cancerx_user');
      setCurrentUser(null);
      // The lack of currentUser will automatically render LoginPage
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setAppData(prevData => ({
      ...prevData,
      users: prevData.users.map(u => u.id === updatedUser.id ? updatedUser : u),
    }));
  };

  const handleShowProfile = () => {
    setView('profile');
  };

  const handleBackToApp = () => {
    setView('selection'); // Always go back to a safe starting point.
  }
  
  const handleNewCase = useCallback(() => {
    if (!currentUser) return;
    let newCaseId: string | null = null;

    setAppData(data => {
        // FIX: Explicitly type 'c' as 'Case' to resolve TypeScript inference issue.
        const allCaseIds = Object.values(data.cases).flat().map((c: Case) => c.id);
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
  
    setAppData(prevAppData => {
      // Destructure to get the cases for the current user and the rest of the cases.
      const { [currentUser.id]: currentUserCases = [], ...otherUserCases } = prevAppData.cases;
  
      // Filter the current user's cases to remove the one to be deleted.
      const updatedCurrentUserCases = currentUserCases.filter(c => c.id !== idToDelete);
  
      // If the length is the same, it means the case was not found, so we can return the original state.
      if (updatedCurrentUserCases.length === currentUserCases.length) {
        return prevAppData;
      }
  
      // Reconstruct the entire 'cases' object with the updated list for the current user.
      const newCasesObject = {
        ...otherUserCases,
        [currentUser.id]: updatedCurrentUserCases,
      };
  
      // Return the new top-level state object.
      return {
        ...prevAppData,
        cases: newCasesObject,
      };
    });
  
    // If the case being deleted was the active one, reset the view to the hub.
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
        result = await withApiKeyCheck(() => analyzeDocument(base64, mimeType));
        if (!result.isReportValid) throw new Error(result.validityReasoning);
      } else {
        result = await withApiKeyCheck(() => analyzeImage(base64, mimeType));
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
        try {
            const report = await withApiKeyCheck(() => createMultiFileSynthesisReport(successfulDocAnalyses, successfulImgAnalyses));
            updateActiveCase(c => ({...c, synthesisReport: report, synthesisStatus: 'done'}));
            setActiveFileId('synthesis');
        } catch(error) {
            console.error("Synthesis failed:", error);
            updateActiveCase(c => ({...c, synthesisStatus: 'idle', synthesizedNodeCount: 0 })); // Reset on failure
        }
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
        const response = await withApiKeyCheck(() => askQuestion(analysisResult, newHistory, message));
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

  if (!apiKeyReady) {
    return <ApiKeySetup user={currentUser} onLogout={handleLogout} onKeySelected={() => setApiKeyReady(true)} />;
  }

  const renderContent = () => {
    switch (view) {
        case 'profile':
            return <ProfilePage user={currentUser} onLogout={handleLogout} onBack={handleBackToApp} onUpdateUser={handleUpdateUser} />;
        case 'selection':
            return <AppSelectionPage user={currentUser} onLogout={handleLogout} onNavigate={setView} onShowProfile={handleShowProfile} />;
        case 'virtual_doctor':
            return <VirtualDoctorPage user={currentUser} cases={userCases} onLogout={handleLogout} onBack={() => setView('selection')} onShowProfile={handleShowProfile} />;
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
