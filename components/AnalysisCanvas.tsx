import React, { useState } from 'react';
import { DataNode } from './DataNode';
import type { NodeData } from '../App';

interface AnalysisCanvasProps {
  nodes: NodeData[];
  onDrop: (files: File[]) => void;
  onNodeClick: (id: string) => void;
  synthesisStatus: 'idle' | 'loading' | 'done';
}

export const AnalysisCanvas: React.FC<AnalysisCanvasProps> = ({ nodes, onDrop, onNodeClick, synthesisStatus }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEvents = (e: React.DragEvent<HTMLElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(Array.from(e.dataTransfer.files));
    }
  };

  const nodeCount = nodes.length;
  const radius = Math.max(150, nodeCount * 25); // Dynamic radius

  return (
    <div
      onDragOver={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDrop={handleDrop}
      className={`w-full h-full flex items-center justify-center transition-all duration-500 ${isDragging ? 'bg-fuchsia-500/10' : ''}`}
    >
      <div className="relative w-full h-full">
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-500 pointer-events-none animate-fade-in">
            <svg className="w-24 h-24 mb-4 text-fuchsia-500/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-300">Start Your Analysis</h2>
            <p className="mt-2 max-w-sm">Drag and drop medical reports and scans anywhere onto the canvas to begin.</p>
          </div>
        ) : (
          <>
            <div 
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${synthesisStatus !== 'idle' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
            >
              <DataNode
                node={{ id: 'synthesis', status: synthesisStatus === 'loading' ? 'analyzing' : 'success' } as any}
                onClick={() => synthesisStatus === 'done' && onNodeClick('synthesis')}
                isSynthesis
                position={{ x: 0, y: 0 }}
              />
            </div>
            {nodes.map((node, i) => {
              const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <DataNode
                  key={node.id}
                  node={node}
                  onClick={() => onNodeClick(node.id)}
                  position={{ x, y }}
                  isSynthesis={false}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};