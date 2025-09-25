import React from 'react';

interface ReportViewProps {
  report: string;
  title: string;
}

const formatMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-stone-800">$1</strong>')
    .replace(/^(\s*)\* (.*)/gm, '$1<li class="flex items-start"><span class="mr-3 mt-1.5 text-teal-500">&#8226;</span><span class="flex-1">$2</span></li>')
    .replace(/(\n|^)(#{1,6})\s(.*)/g, (match, p1, p2, p3) => {
        const level = p2.length;
        const baseClass = "font-bold mt-8 mb-3 text-stone-800 border-b border-stone-200 pb-2";
        if (level <= 2) return `${p1}<h3 class="text-lg md:text-xl ${baseClass} text-teal-700">${p3}</h3>`;
        return `${p1}<h4 class="text-base md:text-lg ${baseClass}">${p3}</h4>`;
    })
    .replace(/(<\/li>)(<li)/g, '$1</li>$2')
    .replace(/((?:<li.*<\/li>)+)/gs, '<ul class="space-y-1.5 mt-2">$1</ul>')
    .replace(/\n/g, '<br />')
    .replace(/<br \/>\s*<br \/>/g, '<br />')
    .replace(/<br \/>(<ul|<h[3-4])/g, '$1')
    .replace(/(<\/ul>|<h[3-4]>)<br \/>/g, '$1');
};

export const ReportView: React.FC<ReportViewProps> = ({ report, title }) => {
  return (
    <div className="p-2">
      <div className="mb-8">
        <p className="text-sm font-medium text-teal-600 mb-1">AI Generated Document</p>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-800">{title}</h2>
      </div>
      <div
        className="prose prose-sm md:prose-base max-w-none text-stone-600"
        dangerouslySetInnerHTML={{ __html: formatMarkdown(report) }}
      />
    </div>
  );
};