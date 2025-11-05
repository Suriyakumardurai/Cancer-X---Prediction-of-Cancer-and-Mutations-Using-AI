import React from 'react';
import { renderMarkdown } from '../utils/markdownUtils';

interface ReportViewProps {
  report: string;
  title: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, title }) => {
  return (
    <div className="p-2">
      <div className="mb-12">
        <p className="text-base font-semibold text-teal-600 mb-2">AI Generated Document</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-color)] tracking-tighter">{title}</h2>
      </div>
      <div
        className="prose-custom max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
      />
    </div>
  );
};