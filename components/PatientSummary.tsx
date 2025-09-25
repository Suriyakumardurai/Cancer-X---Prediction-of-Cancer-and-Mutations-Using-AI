import React from 'react';
import type { DocumentAnalysis } from '../types';

interface PatientSummaryProps {
  data: DocumentAnalysis;
}

const DataBlock: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
  <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
    <p className="text-sm text-stone-500 font-medium">{label}</p>
    <p className="text-lg font-semibold text-stone-800 mt-1 break-words">{value || <span className="text-stone-400">N/A</span>}</p>
  </div>
);

const BiomarkerTag: React.FC<{ name: string; status: string }> = ({ name, status }) => {
    const isPositive = status.toLowerCase().includes('positive');
    const colorClasses = isPositive 
        ? 'bg-red-100 text-red-800 border-red-200' 
        : 'bg-teal-100 text-teal-800 border-teal-200';

    return (
        <div className={`px-3 py-1.5 rounded-full border text-sm flex items-center space-x-2 ${colorClasses}`}>
            <span className="font-bold">{name}:</span>
            <span>{status}</span>
        </div>
    );
};

export const PatientSummary: React.FC<PatientSummaryProps> = ({ data }) => {
  return (
    <div className="p-2">
      <div className="mb-8">
        <p className="text-sm font-medium text-teal-600 mb-1">Report Analysis</p>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-800">{`Findings for: ${data.fileName}`}</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <DataBlock label="Patient Name" value={data.patientName} />
        <DataBlock label="Cancer Type" value={data.cancerType} />
        <DataBlock label="Tumor Grade" value={data.tumorGrade} />
        <DataBlock label="Stage (TNM)" value={data.stage} />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold text-stone-700 mb-4">Biomarkers</h3>
                {data.biomarkers && data.biomarkers.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {data.biomarkers.map((marker, index) => (
                            <BiomarkerTag key={index} name={marker.name} status={marker.status} />
                        ))}
                    </div>
                ) : <p className="text-sm text-stone-500">No biomarkers identified in this report.</p>}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-stone-700 mb-4">Key Findings</h3>
                {data.keyFindings && data.keyFindings.length > 0 ? (
                    <ul className="space-y-3">
                        {data.keyFindings.map((finding, index) => (
                            <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 mr-3 mt-0.5 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                <span className="text-stone-600">{finding}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-stone-500">No key findings extracted from this report.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};