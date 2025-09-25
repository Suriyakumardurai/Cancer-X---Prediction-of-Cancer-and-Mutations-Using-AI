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

export interface FileAnalysisError {
    fileName: string;
    reason: string;
}

export type AppState = 'idle' | 'loading_analysis' | 'loading_synthesis' | 'results' | 'error';