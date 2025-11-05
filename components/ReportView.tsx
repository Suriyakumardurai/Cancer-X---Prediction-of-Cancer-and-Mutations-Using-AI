import React from 'react';

interface ReportViewProps {
  report: string;
  title: string;
}

const formatMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[var(--text-color)]">$1</strong>')
    .replace(/^(\s*)\* (.*)/gm, '$1<li class="flex items-start"><span class="mr-4 mt-2 text-teal-500">&#8226;</span><span class="flex-1">$2</span></li>')
    .replace(/(\n|^)(#{1,6})\s(.*)/g, (match, p1, p2, p3) => {
        const level = p2.length;
        const baseClass = "font-bold mt-12 mb-5 text-[var(--text-color)] border-b border-[var(--border-color)] pb-4 tracking-tighter";
        if (level <= 2) return `${p1}<h3 class="text-2xl md:text-3xl ${baseClass}">${p3}</h3>`;
        return `${p1}<h4 class="text-xl md:text-2xl ${baseClass}">${p3}</h4>`;
    })
    .replace(/(<\/li>)(<li)/g, '$1</li>$2')
    .replace(/((?:<li.*<\/li>)+)/gs, '<ul class="space-y-3.5 mt-6">$1</ul>')
    .replace(/\n/g, '<br />')
    .replace(/<br \/>\s*<br \/>/g, '<br />')
    .replace(/<br \/>(<ul|<h[3-4])/g, '$1')
    .replace(/(<\/ul>|<h[3-4]>)<br \/>/g, '$1');
};

export const ReportView: React.FC<ReportViewProps> = ({ report, title }) => {
  return (
    <div className="p-2">
      <div className="mb-12">
        <p className="text-base font-semibold text-teal-600 mb-2">AI Generated Document</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-color)] tracking-tighter">{title}</h2>
      </div>
      <div
        className="prose prose-base md:prose-lg max-w-none text-slate-700 prose-li:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatMarkdown(report) }}
      />
    </div>
  );
};