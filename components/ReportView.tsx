
import React from 'react';
import { renderMarkdown } from '../utils/markdownUtils';
import type { SynthesisReportData } from '../types';

interface ReportViewProps {
  report: SynthesisReportData;
  title: string;
}

const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-10">
        <h3 className="text-2xl font-bold text-[var(--text-color)] mb-4 pb-3 border-b border-slate-200">{title}</h3>
        {children}
    </div>
);

export const ReportView: React.FC<ReportViewProps> = ({ report, title }) => {
  return (
    <div className="p-2">
      <div className="mb-12">
        <p className="text-base font-semibold text-teal-600 mb-2">AI Generated Document</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-color)] tracking-tighter">{title}</h2>
      </div>
      
      <div className="bg-teal-50 border border-teal-200 rounded-3xl p-6 sm:p-8 mb-12">
          <h3 className="text-2xl font-bold text-teal-800 mb-4">Simplified Summary for the Patient</h3>
          <div
              className="prose-custom max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report.simplifiedSummaryForPatient) }}
          />
      </div>

      <ReportSection title="Source Documents">
          {report.sourceDocuments && report.sourceDocuments.length > 0 ? (
              <ul className="prose-custom max-w-none list-disc pl-5">
                  {report.sourceDocuments.map((doc, i) => <li key={i}>{doc}</li>)}
              </ul>
          ) : (
              <p className="prose-custom max-w-none">No source documents were specified.</p>
          )}
      </ReportSection>

      <ReportSection title="Integrated Clinical Summary">
          <div
              className="prose-custom max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report.integratedClinicalSummary) }}
          />
      </ReportSection>
      
      <ReportSection title="Correlated Findings & Progression">
          <div
              className="prose-custom max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report.correlatedFindings) }}
          />
      </ReportSection>

      <ReportSection title="Key Biomarkers & Clinical Context">
           <div
              className="prose-custom max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report.keyBiomarkers) }}
          />
      </ReportSection>
    </div>
  );
};