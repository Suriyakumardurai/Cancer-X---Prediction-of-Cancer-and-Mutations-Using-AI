import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onDrop: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          onDrop(Array.from(e.target.files));
      }
  };

  return (
    <div
      onDragOver={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 text-center ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50'}`}
    >
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
      />
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <svg className="w-10 h-10 mb-3 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
        <p className="text-sm text-stone-500">
            <span className="font-semibold text-teal-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-stone-400 mt-1">PDF, DOCX, TXT, PNG, JPG, GIF</p>
      </div>
    </div>
  );
};