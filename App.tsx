import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { LandingPage } from './components/LandingPage';
import { analyzeDocument, analyzeImage, createMultiFileSynthesisReport, askQuestion } from './services/geminiService';
import type { DocumentAnalysis, ImageAnalysis, AnalysisResult, ChatMessage } from './types';
import { fileToBase64 } from './utils/fileUtils';

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

const App: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [synthesisReport, setSynthesisReport] = useState<string | null>(null);
  const [synthesisStatus, setSynthesisStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [synthesizedNodeCount, setSynthesizedNodeCount] = useState(0);
  const [activeFileId, setActiveFileId] = useState<string>('welcome');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  useEffect(() => {
    // Manage body scroll based on the current view
    if (showDashboard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function to reset the style when the component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showDashboard]);

  const handleReset = () => {
    setNodes([]);
    setSynthesisReport(null);
    setSynthesisStatus('idle');
    setActiveFileId('welcome');
    setChatHistory([]);
    setSynthesizedNodeCount(0);
  };

  const processFile = async (file: File) => {
    const id = `${file.name}-${file.size}-${Date.now()}`;
    const type = SUPPORTED_DOC_TYPES.includes(file.type) ? 'doc' : 'img';
    
    setNodes(prev => [...prev, { id, file, status: 'analyzing', type }]);
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

      setNodes(prev => prev.map(n => n.id === id ? { ...n, status: 'success', result: {...result, fileName: file.name} } : n));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      setNodes(prev => prev.map(n => n.id === id ? { ...n, status: 'error', error: reason } : n));
    }
  };

  const handleFileDrop = useCallback((droppedFiles: File[]) => {
    const validFiles = Array.from(droppedFiles).filter(f => 
      SUPPORTED_DOC_TYPES.includes(f.type) || SUPPORTED_IMG_TYPES.includes(f.type)
    );
    validFiles.forEach(processFile);
  }, []);
  
  const handleDeleteNode = (idToDelete: string) => {
    setNodes(prevNodes => prevNodes.filter(n => n.id !== idToDelete));
    if (activeFileId === idToDelete) {
      setActiveFileId('welcome');
    }
  };


  useEffect(() => {
    const successfulNodes = nodes.filter(n => n.status === 'success');
    const isProcessing = nodes.some(n => n.status === 'analyzing');

    if (isProcessing) return;

    if (successfulNodes.length === 0) {
      setSynthesisReport(null);
      setSynthesisStatus('idle');
      setSynthesizedNodeCount(0);
      if (activeFileId === 'synthesis') {
          setActiveFileId('welcome');
      }
      return;
    }

    if (successfulNodes.length !== synthesizedNodeCount) {
      const generateSynthesis = async () => {
        setSynthesisStatus('loading');
        setSynthesizedNodeCount(successfulNodes.length);

        const successfulDocAnalyses = successfulNodes.filter(n => n.type === 'doc').map(n => n.result as DocumentAnalysis);
        const successfulImgAnalyses = successfulNodes.filter(n => n.type === 'img').map(n => n.result as ImageAnalysis);
        
        const report = await createMultiFileSynthesisReport(successfulDocAnalyses, successfulImgAnalyses);
        setSynthesisReport(report);
        setSynthesisStatus('done');
        setActiveFileId('synthesis');
      };
      generateSynthesis();
    }
  }, [nodes, synthesizedNodeCount, activeFileId]);

  const handleSendMessage = async (message: string) => {
    if (isChatLoading) return;
    
    const successfulDocAnalyses = nodes.filter(n => n.type === 'doc' && n.status === 'success').map(n => n.result as DocumentAnalysis);
    const successfulImgAnalyses = nodes.filter(n => n.type === 'img' && n.status === 'success').map(n => n.result as ImageAnalysis);
    
    const analysisResult: AnalysisResult = {
        documentAnalyses: successfulDocAnalyses,
        imageAnalyses: successfulImgAnalyses,
        synthesisReport: synthesisReport || undefined,
        imageUrls: {},
    };

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
        const response = await askQuestion(analysisResult, newHistory, message);
        setChatHistory([...newHistory, { role: 'model', content: response }]);
    } catch (err) {
        const errorContent = err instanceof Error ? err.message : "Sorry, I couldn't get a response.";
        setChatHistory([...newHistory, { role: 'model', content: `**Error:** ${errorContent}` }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  if (!showDashboard) {
    return <LandingPage onLaunch={() => setShowDashboard(true)} />;
  }
  
  return (
    <div className="h-screen w-screen bg-[var(--bg-color)] text-stone-800 flex flex-col font-sans">
      <Header onReset={handleReset} onReturnHome={() => setShowDashboard(false)} />
      <main className="flex-grow pt-[64px] flex min-h-0">
        <DiagnosticDashboard
          nodes={nodes}
          activeFileId={activeFileId}
          onFileSelect={setActiveFileId}
          onFileDrop={handleFileDrop}
          onDeleteNode={handleDeleteNode}
          synthesisReport={synthesisReport}
          synthesisStatus={synthesisStatus}
          chatHistory={chatHistory}
          isChatLoading={isChatLoading}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
};

export default App;