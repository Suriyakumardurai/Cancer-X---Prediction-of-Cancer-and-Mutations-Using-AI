
import { GoogleGenAI, Type } from "@google/genai";
import type { DocumentAnalysis, ImageAnalysis, AnalysisResult, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const documentAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        isReportValid: { type: Type.BOOLEAN, description: "Set to true if the document is a valid medical or oncology report, otherwise false." },
        validityReasoning: { type: Type.STRING, description: "If the document is not valid, provide a brief explanation. If it is valid, confirm its validity." },
        patientName: { type: Type.STRING, description: "The patient's full name. If not available or invalid, return an empty string." },
        cancerType: { type: Type.STRING, description: "The specific type of cancer identified. If not available or invalid, return an empty string." },
        tumorGrade: { type: Type.STRING, description: "The grade of the tumor. If not available or invalid, return an empty string." },
        stage: { type: Type.STRING, description: "The cancer stage, preferably using TNM classification. If not available or invalid, return an empty string." },
        biomarkers: {
          type: Type.ARRAY,
          description: "List of identified biomarkers and their status. If not available or invalid, return an empty array.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the biomarker (e.g., ER, PR, HER2)." },
              status: { type: Type.STRING, description: "Status of the biomarker (e.g., Positive, Negative, Percentage)." },
            },
            required: ["name", "status"],
          },
        },
        keyFindings: {
          type: Type.ARRAY,
          description: "A list of the most critical findings from the report. If not available or invalid, return an empty array.",
          items: { type: Type.STRING },
        },
        laypersonsSummary: { type: Type.STRING, description: "A simplified summary of the key findings in easy-to-understand, non-technical language for the patient. Explain complex terms simply. If the report is benign, state that clearly."}
    },
    required: ["isReportValid", "validityReasoning", "patientName", "cancerType", "tumorGrade", "stage", "biomarkers", "keyFindings", "laypersonsSummary"],
};

const imageAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    isScanValid: { type: Type.BOOLEAN, description: "Set to true if the image appears to be a medically relevant visual (e.g., CT, MRI, anatomical illustration), otherwise false." },
    validityReasoning: { type: Type.STRING, description: "If the image is not a valid visual, provide a brief explanation. If it is valid, confirm its validity and identify its type (e.g., 'This is a valid CT scan of the chest.')." },
    imageDescription: { type: Type.STRING, description: "A concise, technical description of the medical image itself. If not available or invalid, return an empty string." },
    findingsSummary: {
      type: Type.STRING,
      description: "A concise summary of the clinical findings or key features shown in the visual. Use Markdown for formatting if necessary (e.g., bullet points for multiple findings). If not available or invalid, return an empty string.",
    },
    laypersonsSummary: { type: Type.STRING, description: "A simplified summary of the key findings in easy-to-understand, non-technical language for the patient. Explain complex terms simply. If the scan is normal, state that clearly." },
    regionsOfInterest: {
      type: Type.ARRAY,
      description: "A list of suspicious or key regions identified. Bounding boxes must be precise. If not applicable (e.g., simple diagram) or not available, return an empty array.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "A label for the identified region (e.g., 'Suspicious Nodule', 'Aortic Arch')." },
          probability: { type: Type.NUMBER, description: "The model's confidence score (0.0 to 1.0) that this region is significant or malignant. For diagrams, this can be 1.0." },
          x_min: { type: Type.NUMBER, description: "Normalized minimum X coordinate (0.0-1.0) of the bounding box." },
          y_min: { type: Type.NUMBER, description: "Normalized minimum Y coordinate (0.0-1.0) of the bounding box." },
          x_max: { type: Type.NUMBER, description: "Normalized maximum X coordinate (0.0-1.0) of the bounding box." },
          y_max: { type: Type.NUMBER, description: "Normalized maximum Y coordinate (0.0-1.0) of the bounding box." },
        },
        required: ["label", "probability", "x_min", "y_min", "x_max", "y_max"],
      },
    },
  },
  required: ["isScanValid", "validityReasoning", "imageDescription", "findingsSummary", "laypersonsSummary", "regionsOfInterest"],
};


export const analyzeDocument = async (base64Report: string, mimeType: string): Promise<DocumentAnalysis> => {
  const filePart = { inlineData: { data: base64Report, mimeType } };
  const textPart = { text: `Your task is to act as a world-class medical data extraction system with expertise in oncology. Your accuracy is paramount. 1. **VALIDATE & EXTRACT:** First, carefully examine the provided document. Determine if it is a medical document (e.g., oncology, pathology report). If it IS a valid report, set \`isReportValid\` to \`true\` and accurately extract all required information. 2. **SUMMARIZE FOR PATIENT:** Create a 'laypersonsSummary' that explains the key findings in simple, easy-to-understand terms. Avoid jargon. If the report is benign or normal, state this clearly and reassuringly. 3. **HANDLE INVALID DOCS:** If it is NOT a valid report, set \`isReportValid\` to \`false\`, provide a reason, and populate all other fields with empty values.` };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [filePart, textPart] },
    config: { responseMimeType: 'application/json', responseSchema: documentAnalysisSchema },
  });
  return JSON.parse(response.text.trim());
};

export const analyzeImage = async (base64Image: string, mimeType: string): Promise<ImageAnalysis> => {
  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const textPart = { text: `You are a world-class AI medical imaging analyst. Your task is to analyze the provided image with the highest degree of accuracy. 1. **VALIDATE & ANALYZE:** Determine if it's a medically relevant image (e.g., CT, MRI). If valid, provide a technical description and summarize clinical findings. Identify key regions of interest with bounding boxes only if clinically relevant abnormalities are present. 2. **SUMMARIZE FOR PATIENT:** Create a 'laypersonsSummary' that explains what the scan shows and what the findings mean in simple, non-technical language. If the scan appears normal, state this clearly and reassuringly. 3. **HANDLE INVALID IMAGES:** If it's not a medically relevant image (e.g., a photo of a car), set \`isScanValid\` to \`false\`, explain why, and leave other fields empty.` };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: { responseMimeType: 'application/json', responseSchema: imageAnalysisSchema }
  });
  return JSON.parse(response.text.trim());
};

export const createMultiFileSynthesisReport = async (documentAnalyses: DocumentAnalysis[], imageAnalyses: ImageAnalysis[]): Promise<string> => {
  if (documentAnalyses.length === 0 && imageAnalyses.length === 0) {
    return "No valid data available to generate a synthesis report.";
  }
  
  const prompt = `You are an expert AI assistant for oncologists. Create a unified Patient Synthesis Report by correlating findings from the provided set of pathology reports and medical scans. Structure your response using Markdown for optimal clarity.

**Pathology Report Analyses (${documentAnalyses.length} reports):**
${documentAnalyses.map(doc => `--- Report: ${doc.fileName} ---\n${JSON.stringify(doc, null, 2)}`).join('\n\n')}

**Medical Scan Analyses (${imageAnalyses.length} scans):**
${imageAnalyses.map(img => `--- Scan: ${img.fileName} ---\n${JSON.stringify(img, null, 2)}`).join('\n\n')}

**Instructions:**
1.  Start with a title: \`## Unified Synthesis Report\`.
2.  Create a section \`### Source Documents\`. Provide a bulleted list of all source filenames.
3.  Create a section \`### Integrated Clinical Summary\`. Consolidate patient details and summarize the overall clinical picture.
4.  Create a section \`### Correlated Findings & Progression\`. Critically correlate findings across ALL documents. Use a **Markdown table** if useful to compare findings side-by-side. Explicitly state whether scans confirm findings in reports (e.g., "The nodule in \`scan.jpeg\` corresponds to the mass in \`report.pdf\`."). Note any progression or discrepancies.
5.  Create a section \`### Key Biomarkers & Clinical Context\`. List and explain the significance of any identified biomarkers.
6.  Finally, create a section \`### Simplified Summary for the Patient\`. Explain the overall results in simple, non-technical language that a patient can easily understand. Be clear and reassuring if the findings are benign.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.1 }
  });
  return response.text;
};

export const askQuestion = async (analysisContext: AnalysisResult, history: ChatMessage[], question: string): Promise<string> => {
    const contextPrompt = `
      You are an expert oncology AI assistant. Your purpose is to answer questions based *only* on the provided analysis data from a patient's case file. Do not use external knowledge. Explain complex medical terms in a simple way if the user's question implies they are not a medical professional. Format your answer clearly using Markdown (lists, bolding) if it helps with readability.
      
      **Available Analysis Context:**
      ${analysisContext.documentAnalyses.length > 0 ? `**Pathology Report Summaries:**\n${analysisContext.documentAnalyses.map(doc => `File: ${doc.fileName}\n${JSON.stringify(doc, null, 2)}`).join('\n---\n')}` : ''}
      ${analysisContext.imageAnalyses.length > 0 ? `**Medical Scan Summaries:**\n${analysisContext.imageAnalyses.map(img => `File: ${img.fileName}\n${JSON.stringify(img, null, 2)}`).join('\n---\n')}` : ''}
      ${analysisContext.synthesisReport ? `**Integrated Synthesis:**\n${analysisContext.synthesisReport}`: ''}

      **Conversation History:**
      ${history.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

      **New User Question:**
      ${question}

      Based only on the information above, provide a concise and accurate answer. If the answer cannot be found in the provided context, state that clearly.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
        config: {
            temperature: 0.2,
        }
    });

    return response.text;
}