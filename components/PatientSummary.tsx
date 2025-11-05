import React from 'react';
import type { DocumentAnalysis } from '../types';
import { renderMarkdown } from '../utils/markdownUtils';

interface PatientSummaryProps {
  data: DocumentAnalysis;
}

const DataBlock: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
  <div className="bg-slate-50 p-4 rounded-2xl border border-[var(--border-color)]">
    <p className="text-sm text-[var(--text-muted-color)] font-medium">{label}</p>
    <p className="text-lg font-semibold text-[var(--text-color)] mt-1 break-words">{value || <span className="text-slate-400">N/A</span>}</p>
  </div>
);

const BiomarkerTag: React.FC<{ name: string; status: string }> = ({ name, status }) => {
    const isPositive = status.toLowerCase().includes('positive');
    const colorClasses = isPositive 
        ? 'bg-rose-100 text-rose-800 border-rose-200/0' 
        : 'bg-teal-100 text-teal-800 border-teal-200/0';

    return (
        <div className={`px-4 py-2 rounded-full border text-sm flex items-center space-x-2 ${colorClasses}`}>
            <span className="font-bold">{name}:</span>
            <span>{status}</span>
        </div>
    );
};

export const PatientSummary: React.FC<PatientSummaryProps> = ({ data }) => {
  return (
    <div className="p-2">
      <div className="mb-12">
        <p className="text-base font-semibold text-teal-600 mb-2">Report Analysis</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-color)] tracking-tighter">{`Findings for: ${data.fileName}`}</h2>
      </div>
      
      {data.laypersonsSummary && (
        <div className="mb-12 bg-teal-50 border border-teal-200 rounded-3xl p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-teal-800 mb-4">Simplified Summary for the Patient</h3>
            <div
                className="prose-custom max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(data.laypersonsSummary) }}
            />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
        <DataBlock label="Patient Name" value={data.patientName} />
        <DataBlock label="Cancer Type" value={data.cancerType} />
        <DataBlock label="Tumor Grade" value={data.tumorGrade} />
        <DataBlock label="Stage (TNM)" value={data.stage} />
      </div>

      <div className="bg-white border border-[var(--border-color)] rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
            <div>
                <h3 className="text-2xl font-bold text-[var(--text-color)] mb-6">Biomarkers</h3>
                {data.biomarkers && data.biomarkers.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                        {data.biomarkers.map((marker, index) => (
                            <BiomarkerTag key={index} name={marker.name} status={marker.status} />
                        ))}
                    </div>
                ) : <p className="text-base text-[var(--text-muted-color)]">No biomarkers identified in this report.</p>}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-[var(--text-color)] mb-6">Key Findings</h3>
                {data.keyFindings && data.keyFindings.length > 0 ? (
                    <ul className="space-y-4">
                        {data.keyFindings.map((finding, index) => (
                            <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 mr-4 mt-1 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                <span className="text-slate-700 leading-relaxed text-base">{finding}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-base text-[var(--text-muted-color)]">No key findings extracted from this report.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};