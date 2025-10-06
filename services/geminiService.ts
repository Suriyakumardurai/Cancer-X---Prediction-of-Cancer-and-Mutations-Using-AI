import { GoogleGenAI, Type } from "@google/genai";
import type { DocumentAnalysis, ImageAnalysis, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- Helper Functions ---

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

const safeJsonParse = (text: string) => {
    try {
        const match = text.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = match ? match[1] : text;
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from model response:", text);
        throw new Error("Model returned invalid JSON.");
    }
};


// --- Gemini Schemas ---

const documentAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        isReportValid: { type: Type.BOOLEAN }, validityReasoning: { type: Type.STRING }, patientName: { type: Type.STRING }, cancerType: { type: Type.STRING }, tumorGrade: { type: Type.STRING }, stage: { type: Type.STRING },
        biomarkers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, status: { type: Type.STRING } } } },
        keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["isReportValid", "validityReasoning", "patientName", "cancerType", "tumorGrade", "stage", "biomarkers", "keyFindings"],
};
const imageAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    isScanValid: { type: Type.BOOLEAN }, validityReasoning: { type: Type.STRING }, imageDescription: { type: Type.STRING }, findingsSummary: { type: Type.STRING },
    regionsOfInterest: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, probability: { type: Type.NUMBER }, x_min: { type: Type.NUMBER }, y_min: { type: Type.NUMBER }, x_max: { type: Type.NUMBER }, y_max: { type: Type.NUMBER } } } },
  },
  required: ["isScanValid", "validityReasoning", "imageDescription", "findingsSummary", "regionsOfInterest"],
};


// --- Core API Functions ---

export const analyzeDocument = async (file: File): Promise<DocumentAnalysis> => {
    const filePart = await fileToGenerativePart(file);
    const textPart = { text: `Your task is to act as a world-class medical data extraction system with expertise in oncology. Your accuracy is paramount. 1. **VALIDATE THE DOCUMENT:** First, carefully examine the provided document file. Perform OCR if necessary. Determine if it is a medical document, specifically an oncology or pathology report. 2. **RESPOND BASED ON VALIDITY:** If it is NOT a valid report, set \`isReportValid\` to \`false\`, provide a reason, and populate all other fields with empty values. If it IS a valid report, set \`isReportValid\` to \`true\` and accurately extract all required information. **Crucially, if the report's conclusion is benign, normal, or shows no evidence of malignancy, ensure this is clearly stated as the primary entry in the \`keyFindings\` array.**` };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [filePart, textPart] }, config: { responseMimeType: 'application/json', responseSchema: documentAnalysisSchema }});
    return safeJsonParse(response.text.trim());
};

export const analyzeImage = async (file: File): Promise<ImageAnalysis> => {
    const imagePart = await fileToGenerativePart(file);
    const textPart = { text: `You are a world-class AI medical imaging analyst. Your task is to analyze the provided image with the highest degree of accuracy. 1. **VALIDATE THE IMAGE:** Determine if it is a medically relevant image (e.g., CT scan, MRI, X-ray, anatomical illustration, pathology diagram). 2. **DESCRIBE & ANALYZE:** If valid, provide a concise technical description and summarize clinical findings. **Crucially, if the image shows healthy tissue or a normal scan with no signs of malignancy or significant abnormalities, the \`findingsSummary\` must clearly state this (e.g., "The scan appears normal with no evidence of malignancy.").** Do not pathologize normal features. Identify key regions of interest with bounding boxes only if clinically relevant abnormalities are present. 3. **HANDLE INVALID IMAGES:** If it's not a medically relevant image (e.g., a photo of a car), set \`isScanValid\` to \`false\`, explain why, and leave other fields empty.` };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] }, config: { responseMimeType: 'application/json', responseSchema: imageAnalysisSchema }});
    return safeJsonParse(response.text.trim());
};

export const createMultiFileSynthesisReport = async (documentAnalyses: (DocumentAnalysis & {fileName: string})[], imageAnalyses: (ImageAnalysis & {fileName: string})[]): Promise<string> => {
    const prompt = `You are an expert AI assistant for oncologists. Create a unified Patient Synthesis Report by correlating findings from the provided set of pathology reports and medical scans. **Pathology Report Analyses (${documentAnalyses.length} reports):** ${documentAnalyses.map(doc => `--- Report: ${doc.fileName} ---\n${JSON.stringify(doc, null, 2)}`).join('\n\n')} **Medical Scan Analyses (${imageAnalyses.length} scans):** ${imageAnalyses.map(img => `--- Scan: ${img.fileName} ---\n${JSON.stringify(img, null, 2)}`).join('\n\n')} **Instructions:** 1. First, create a section titled **"Source Documents"**. In this section, provide a simple bulleted list of the filenames of all reports and scans being analyzed (e.g., \`* Report: patient_report_2023.pdf\`). 2. Next, create a high-level **"Integrated Summary"**. 3. Then, in a section called **"Correlated Findings & Progression"**, critically correlate findings across ALL documents. 4. Finally, create a section for **"Key Biomarkers & Clinical Context"**. 5. Maintain a professional, clinical tone. Use markdown for clear formatting.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.1 }});
    return response.text;
};

interface ChatContext {
    documentAnalyses: (DocumentAnalysis & {fileName: string})[];
    imageAnalyses: (ImageAnalysis & {fileName: string})[];
    synthesisReport: string | null;
}

export const askQuestion = async (analysisContext: ChatContext, history: ChatMessage[], question: string): Promise<string> => {
    const contextPrompt = `You are an expert oncology AI assistant. Your purpose is to answer questions based *only* on the provided analysis data from a patient's case file. Do not use external knowledge. **Available Analysis Context:** ${analysisContext.documentAnalyses.length > 0 ? `**Pathology Report Summaries:**\n${analysisContext.documentAnalyses.map(doc => `File: ${doc.fileName}\n${JSON.stringify(doc, null, 2)}`).join('\n---\n')}` : ''} ${analysisContext.imageAnalyses.length > 0 ? `**Medical Scan Summaries:**\n${analysisContext.imageAnalyses.map(img => `File: ${img.fileName}\n${JSON.stringify(img, null, 2)}`).join('\n---\n')}` : ''} ${analysisContext.synthesisReport ? `**Integrated Synthesis:**\n${analysisContext.synthesisReport}`: ''} **Conversation History:** ${history.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')} **New User Question:** ${question} Based only on the information above, provide a concise and accurate answer.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: contextPrompt, config: { temperature: 0.2 }});
    return response.text;
};
