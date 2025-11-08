
import { GoogleGenAI, Type } from "@google/genai";
import type { DocumentAnalysis, ImageAnalysis, AnalysisResult, ChatMessage, SynthesisReportData } from '../types';

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

const synthesisReportSchema = {
    type: Type.OBJECT,
    properties: {
        sourceDocuments: {
            type: Type.ARRAY,
            description: "A list of the filenames of all source documents and scans used for this synthesis.",
            items: { type: Type.STRING },
        },
        integratedClinicalSummary: {
            type: Type.STRING,
            description: "A consolidated summary of the overall clinical picture, integrating findings from all sources.",
        },
        correlatedFindings: {
            type: Type.STRING,
            description: "A Markdown-formatted table that correlates and compares specific findings across all documents. Must include a header separator. Example: '| Finding | Location | Characteristics |\\n|---|---|---|\\n| Nodule | Left Lung | 2cm, spiculated |'",
        },
        keyBiomarkers: {
            type: Type.STRING,
            description: "A summary paragraph explaining the significance of any identified biomarkers in the clinical context.",
        },
        simplifiedSummaryForPatient: {
            type: Type.STRING,
            description: "The overall results explained in simple, non-technical language that a patient can easily understand. Must be clear and reassuring if findings are benign.",
        },
    },
    required: ["sourceDocuments", "integratedClinicalSummary", "correlatedFindings", "keyBiomarkers", "simplifiedSummaryForPatient"],
};


export const analyzeDocument = async (base64Report: string, mimeType: string): Promise<DocumentAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const textPart = { text: `You are a world-class AI medical imaging analyst. Your task is to analyze the provided image with the highest degree of accuracy. 1. **VALIDATE & ANALYZE:** Determine if it's a medically relevant image (e.g., CT, MRI). If valid, provide a technical description and summarize clinical findings. Identify key regions of interest with bounding boxes only if clinically relevant abnormalities are present. 2. **SUMMARIZE FOR PATIENT:** Create a 'laypersonsSummary' that explains what the scan shows and what the findings mean in simple, non-technical language. If the scan appears normal, state this clearly and reassuringly. 3. **HANDLE INVALID IMAGES:** If it's not a medically relevant image (e.g., a photo of a car), set \`isScanValid\` to \`false\`, explain why, and leave other fields empty.` };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: { responseMimeType: 'application/json', responseSchema: imageAnalysisSchema }
  });
  return JSON.parse(response.text.trim());
};

export const createMultiFileSynthesisReport = async (documentAnalyses: DocumentAnalysis[], imageAnalyses: ImageAnalysis[]): Promise<SynthesisReportData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  if (documentAnalyses.length === 0 && imageAnalyses.length === 0) {
    // Return a default structure if there's no data
    return {
        sourceDocuments: [],
        integratedClinicalSummary: "No valid data available to generate a synthesis report.",
        correlatedFindings: "N/A",
        keyBiomarkers: "N/A",
        simplifiedSummaryForPatient: "No analysis was performed as no valid documents were provided.",
    };
  }
  
  // Create concise summaries to reduce token load
  const docSummaries = documentAnalyses.map(doc => `
    - Report File: ${doc.fileName}
    - Cancer Type: ${doc.cancerType || 'N/A'}
    - Stage: ${doc.stage || 'N/A'}
    - Key Findings: ${doc.keyFindings?.join(', ') || 'None'}
    - Biomarkers: ${doc.biomarkers?.map(b => `${b.name} (${b.status})`).join(', ') || 'None'}
  `).join('\n');

  const imgSummaries = imageAnalyses.map(img => `
    - Scan File: ${img.fileName}
    - Description: ${img.imageDescription || 'N/A'}
    - Findings Summary: ${img.findingsSummary || 'None'}
  `).join('\n');

  const prompt = `You are an expert AI assistant for oncologists. Create a unified Patient Synthesis Report by correlating findings from the provided summaries of pathology reports and medical scans. Respond with a JSON object that strictly adheres to the provided schema.

**CONCISE SUMMARIES FOR ANALYSIS:**

**Pathology Reports:**
${docSummaries}

**Medical Scans:**
${imgSummaries}

**Instructions:**
Based on the concise summaries above, generate a JSON object containing the following fields:
1.  \`sourceDocuments\`: A list of all source filenames.
2.  \`integratedClinicalSummary\`: Consolidate patient details and summarize the overall clinical picture.
3.  \`correlatedFindings\`: A **string containing a Markdown table** that correlates findings. It MUST include a header and separator line (e.g., \`| Finding | Location | Characteristics |\\n|---|---|---|\`). Note any progression or discrepancies.
4.  \`keyBiomarkers\`: A paragraph explaining the significance of any identified biomarkers.
5.  \`simplifiedSummaryForPatient\`: Explain the overall results in simple, non-technical language. Be clear and reassuring if the findings are benign.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { 
        temperature: 0.1,
        responseMimeType: 'application/json', 
        responseSchema: synthesisReportSchema
    }
  });
  return JSON.parse(response.text.trim());
};

export const askQuestion = async (analysisContext: AnalysisResult, history: ChatMessage[], question: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const contextPrompt = `
      You are an expert oncology AI assistant. Your purpose is to answer questions based *only* on the provided analysis data from a patient's case file. Do not use external knowledge. Explain complex medical terms in a simple way if the user's question implies they are not a medical professional. Format your answer clearly using Markdown (lists, bolding) if it helps with readability.
      
      **Available Analysis Context:**
      ${analysisContext.documentAnalyses.length > 0 ? `**Pathology Report Summaries:**\n${analysisContext.documentAnalyses.map(doc => `File: ${doc.fileName}\n${JSON.stringify(doc, null, 2)}`).join('\n---\n')}` : ''}
      ${analysisContext.imageAnalyses.length > 0 ? `**Medical Scan Summaries:**\n${analysisContext.imageAnalyses.map(img => `File: ${img.fileName}\n${JSON.stringify(img, null, 2)}`).join('\n---\n')}` : ''}
      ${analysisContext.synthesisReport ? `**Integrated Synthesis:**\n${JSON.stringify(analysisContext.synthesisReport, null, 2)}`: ''}

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