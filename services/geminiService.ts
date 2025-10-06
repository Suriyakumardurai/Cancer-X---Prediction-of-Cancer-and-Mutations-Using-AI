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
    },
    required: ["isReportValid", "validityReasoning", "patientName", "cancerType", "tumorGrade", "stage", "biomarkers", "keyFindings"],
};

const imageAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    isScanValid: { type: Type.BOOLEAN, description: "Set to true if the image appears to be a medically relevant visual (e.g., CT, MRI, anatomical illustration), otherwise false." },
    validityReasoning: { type: Type.STRING, description: "If the image is not a valid visual, provide a brief explanation. If it is valid, confirm its validity and identify its type (e.g., 'This is a valid CT scan of the chest.')." },
    imageDescription: { type: Type.STRING, description: "A concise, technical description of the medical image itself. If not available or invalid, return an empty string." },
    findingsSummary: {
      type: Type.STRING,
      description: "A concise summary of the clinical findings or key features shown in the visual. If not available or invalid, return an empty string.",
    },
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
  required: ["isScanValid", "validityReasoning", "imageDescription", "findingsSummary", "regionsOfInterest"],
};


export const analyzeDocument = async (base64Report: string, mimeType: string): Promise<DocumentAnalysis> => {
  const filePart = { inlineData: { data: base64Report, mimeType } };
  const textPart = { text: `Your task is to act as a world-class medical data extraction system with expertise in oncology. Your accuracy is paramount. 1. **VALIDATE THE DOCUMENT:** First, carefully examine the provided document file. Perform OCR if necessary. Determine if it is a medical document, specifically an oncology or pathology report. 2. **RESPOND BASED ON VALIDITY:** If it is NOT a valid report, set \`isReportValid\` to \`false\`, provide a reason, and populate all other fields with empty values. If it IS a valid report, set \`isReportValid\` to \`true\` and accurately extract all required information. **Crucially, if the report's conclusion is benign, normal, or shows no evidence of malignancy, ensure this is clearly stated as the primary entry in the \`keyFindings\` array.**` };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [filePart, textPart] },
    config: { responseMimeType: 'application/json', responseSchema: documentAnalysisSchema },
  });
  return JSON.parse(response.text.trim());
};

export const analyzeImage = async (base64Image: string, mimeType: string): Promise<ImageAnalysis> => {
  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const textPart = { text: `You are a world-class AI medical imaging analyst. Your task is to analyze the provided image with the highest degree of accuracy. 1. **VALIDATE THE IMAGE:** Determine if it is a medically relevant image (e.g., CT scan, MRI, X-ray, anatomical illustration, pathology diagram). 2. **DESCRIBE & ANALYZE:** If valid, provide a concise technical description and summarize clinical findings. **Crucially, if the image shows healthy tissue or a normal scan with no signs of malignancy or significant abnormalities, the \`findingsSummary\` must clearly state this (e.g., "The scan appears normal with no evidence of malignancy.").** Do not pathologize normal features. Identify key regions of interest with bounding boxes only if clinically relevant abnormalities are present. 3. **HANDLE INVALID IMAGES:** If it's not a medically relevant image (e.g., a photo of a car), set \`isScanValid\` to \`false\`, explain why, and leave other fields empty.` };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: { responseMimeType: 'application/json', responseSchema: imageAnalysisSchema }
  });
  return JSON.parse(response.text.trim());
};

export const createMultiFileSynthesisReport = async (documentAnalyses: DocumentAnalysis[], imageAnalyses: ImageAnalysis[], initialQuery?: string): Promise<string> => {
  if (documentAnalyses.length === 0 && imageAnalyses.length === 0) {
    return "No valid data available to generate a synthesis report.";
  }
  
  const prompt = `You are an expert AI assistant for oncologists. Create a unified Patient Synthesis Report by correlating findings from the provided set of pathology reports and medical scans.

    ${initialQuery ? `**Analyst Directive:**\n${initialQuery}\n` : ''}
    
    **Pathology Report Analyses (${documentAnalyses.length} reports):**
    ${documentAnalyses.map(doc => `--- Report: ${doc.fileName} ---\n${JSON.stringify(doc, null, 2)}`).join('\n\n')}

    **Medical Scan Analyses (${imageAnalyses.length} scans):**
    ${imageAnalyses.map(img => `--- Scan: ${img.fileName} ---\n${JSON.stringify(img, null, 2)}`).join('\n\n')}
    
    **Instructions:**
    1.  First, create a section titled **"Source Documents"**. In this section, provide a simple bulleted list of the filenames of all reports and scans being analyzed (e.g., \`* Report: patient_report_2023.pdf\`, \`* Scan: ct_scan_chest.jpeg\`).
    2.  Next, create a high-level **"Integrated Summary"**. Consolidate patient details if they are consistent across reports. If an analyst directive was provided, address it directly in this summary.
    3.  Then, in a section called **"Correlated Findings & Progression"**, critically correlate findings across ALL documents. Explicitly state whether scans confirm findings in reports and reference the specific files (e.g., "The nodule seen in \`ct_scan_chest.jpeg\` corresponds to the mass described in \`pathology_report.pdf\`."). If multiple reports exist, note any progression or changes over time. Highlight any discrepancies.
    4.  Finally, create a section for **"Key Biomarkers & Clinical Context"**.
    5.  Maintain a professional, clinical tone. Be concise and direct. Use markdown for clear formatting.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.1 }
  });
  return response.text;
};

export const askQuestion = async (analysisContext: AnalysisResult, history: ChatMessage[], question: string, initialQuery?: string): Promise<string> => {
    const contextPrompt = `
      You are an expert oncology AI assistant. Your purpose is to answer questions based *only* on the provided analysis data from a patient's case file. Do not use external knowledge or make assumptions beyond what is in the context.

      ${initialQuery ? `**Initial Analyst Directive (provided before analysis):**\n${initialQuery}`: ''}
      
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