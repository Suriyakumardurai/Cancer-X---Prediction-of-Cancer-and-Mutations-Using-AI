import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';

interface ProfilePopoverProps {
  user: User;
  onLogout: () => void;
}

export const ProfilePopover: React.FC<ProfilePopoverProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={popoverRef} className="relative">
      <button 
        onClick={() => setIsOpen(p => !p)} 
        className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
      >
        {getInitials(user.name)}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-[var(--border-color)] rounded-2xl shadow-xl z-50 p-2 animate-fade-in-up">
          <div className="p-3 border-b border-[var(--border-color)]">
            <p className="text-base font-semibold text-[var(--text-color)] truncate">{user.name}</p>
            <p className="text-sm text-[var(--text-muted-color)] truncate">{user.email}</p>
            <p className="text-xs font-mono text-slate-400 mt-2">User ID: {user.id}</p>
          </div>
          <div className="p-1 mt-1">
             <button 
                onClick={onLogout} 
                className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};