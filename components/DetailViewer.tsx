import React, { useEffect, useState } from 'react';
import { PatientSummary } from './PatientSummary';
import { ImageViewer } from './ImageViewer';
import { ReportView } from './ReportView';
import { NodeData } from '../App';
import { DocumentAnalysis, ImageAnalysis } from '../types';

interface DetailViewerProps {
    node?: NodeData;
    synthesisReport: string | null;
    showSynthesis: boolean;
    onClose: () => void;
}

export const DetailViewer: React.FC<DetailViewerProps> = ({ node, synthesisReport, showSynthesis, onClose }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (node?.type === 'img' && node.file) {
            const url = URL.createObjectURL(node.file);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [node]);
    
    const renderContent = () => {
        if (showSynthesis) {
            return synthesisReport 
                ? <ReportView report={synthesisReport} title="AI Synthesis Report" />
                : <p>Synthesis report is not available.</p>;
        }

        if (node?.status === 'success') {
            if (node.type === 'doc') {
                return <PatientSummary data={node.result as DocumentAnalysis} />;
            }
            if (node.type === 'img' && imageUrl) {
                return <ImageViewer imageUrl={imageUrl} analysis={node.result as ImageAnalysis} />;
            }
        }
        
        if (node?.status === 'error') {
            return (
                <div className="text-center p-8">
                    <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-100">Analysis Failed</h2>
                    <p className="mt-2 text-gray-400">{node.error || 'An unknown error occurred.'}</p>
                </div>
            )
        }
        
        return <p>No data to display.</p>;
    }

    return (
        <>
        <div 
            className="fixed inset-0 bg-black/70 z-20 animate-fade-in"
            onClick={onClose}
        ></div>
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
             <div className="w-full max-w-6xl h-[90vh] bg-[var(--surface-color)] backdrop-blur-xl rounded-2xl border border-[var(--border-color)] shadow-2xl shadow-fuchsia-900/50 flex flex-col animate-fade-in-up">
                <div className="flex-shrink-0 p-4 border-b border-[var(--border-color)] flex justify-end">
                    <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-white/10 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto dark-scrollbar">
                    {renderContent()}
                </div>
            </div>
        </div>
        </>
    );
};

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6"x2="18" y2="18"></line></svg>
);
// FIX: Updated XCircleIcon to accept props like className, resolving the type error.
const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
