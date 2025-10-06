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
  regionsOfInterest?: BoundingBox[];
}

export interface AnalysisResult {
  documentAnalyses: DocumentAnalysis[];
  imageAnalyses: ImageAnalysis[];
  synthesisReport?: string;
  imageUrls: { [fileName: string]: string };
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

// --- App Data Structures ---

export type NodeStatus = 'pending' | 'analyzing' | 'success' | 'error';

// This interface reflects the data coming from the backend API now.
// The actual 'File' object is no longer stored on the client.
export interface NodeData {
  id: string;
  file_name: string; // Changed from 'file' object
  mime_type: string;
  status: NodeStatus;
  result?: DocumentAnalysis | ImageAnalysis;
  error?: string;
  type: 'doc' | 'img';
  // The 'file' object can be temporarily added during optimistic updates
  file?: File; 
}

export interface Case {
  id: string;
  name: string;
  createdAt: number;
  nodes: NodeData[];
  synthesisReport: string | null;
  synthesisStatus: 'idle' | 'loading' | 'done';
  chatHistory: ChatMessage[];
  synthesizedNodeCount: number;
}
