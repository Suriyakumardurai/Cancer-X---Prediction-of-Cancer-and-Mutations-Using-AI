

export interface DocumentAnalysis {
  fileName?: string;
  isReportValid: boolean;
  validityReasoning: string;
  patientName?: string;
  cancerType?: string;
  tumorGrade?: string;
  stage?: string;
  biomarkers?: { name: string; status: string }[];
  keyFindings?: string[];
  laypersonsSummary?: string;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  label: string;
  probability: number;
}

export interface ImageAnalysis {
  fileName?: string;
  isScanValid: boolean;
  validityReasoning: string;
  imageDescription?: string;
  findingsSummary?: string;
  laypersonsSummary?: string;
  regionsOfInterest?: BoundingBox[];
}

export interface AnalysisResult {
  documentAnalyses: DocumentAnalysis[];
  imageAnalyses: ImageAnalysis[];
  synthesisReport?: SynthesisReportData;
  imageUrls: { [fileName: string]: string };
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface FileAnalysisError {
    fileName: string;
    reason: string;
}

export type AppState = 'idle' | 'loading_analysis' | 'loading_synthesis' | 'results' | 'error';

export interface User {
  id: string; // 6-character unique code
  name: string;
  email: string;
  password?: string; // Stored in-memory for this demo, NEVER do this in production
}

// --- Report Data Structure ---
export interface SynthesisReportData {
  sourceDocuments: string[];
  integratedClinicalSummary: string;
  correlatedFindings: string; // This will contain the Markdown table
  keyBiomarkers: string;
  simplifiedSummaryForPatient: string;
}


// --- Core Data Structures ---

export type NodeStatus = 'pending' | 'analyzing' | 'success' | 'error';

export interface NodeData {
  id: string;
  file: File;
  status: NodeStatus;
  result?: DocumentAnalysis | ImageAnalysis;
  error?: string;
  type: 'doc' | 'img';
  dataUrl?: string; // Essential for displaying images after rehydration
}

export interface Case {
  id: string;
  name: string;
  createdAt: number;
  nodes: NodeData[];
  synthesisReport: SynthesisReportData | null;
  synthesisStatus: 'idle' | 'loading' | 'done';
  synthesizedNodeCount: number;
  chatHistory: ChatMessage[];
}

export interface AppData {
    users: User[];
    cases: Record<string, Case[]>; // Keyed by user ID
}