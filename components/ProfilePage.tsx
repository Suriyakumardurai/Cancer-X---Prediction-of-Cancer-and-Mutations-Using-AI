import React from 'react';
import type { User } from '../types';
import { ProfilePopover } from './ProfilePopover';

interface ProfilePageProps {
  user: User;
  apiKey: string | null;
  onLogout: () => void;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onUpdateApiKey: (key: string) => void;
  onClearApiKey: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, apiKey, onLogout, onBack, onUpdateUser, onUpdateApiKey, onClearApiKey }) => {
  const [keyUpdateStatus, setKeyUpdateStatus] = React.useState<'idle' | 'success'>('idle');
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [name, setName] = React.useState(user.name);
  const [newApiKey, setNewApiKey] = React.useState('');

  const handleUpdateKey = () => {
    if (newApiKey.trim()) {
      onUpdateApiKey(newApiKey.trim());
      setKeyUpdateStatus('success');
      setNewApiKey('');
      setTimeout(() => setKeyUpdateStatus('idle'), 3000); // Reset after 3 seconds
    }
  };
  
  const handleSaveName = () => {
    if (name.trim() && name.trim() !== user.name) {
      onUpdateUser({ ...user, name: name.trim() });
    } else {
      setName(user.name); // Revert if empty
    }
    setIsEditingName(false);
  };

  const handleClearKeyClick = () => {
    if (window.confirm("Are you sure you want to clear your saved API key? You will be logged out and will need to enter a new one to use AI features.")) {
      onClearApiKey();
      onLogout(); // Forcing a clean state is safer
    }
  };
  
  const getMaskedApiKey = (key: string | null): string => {
    if (!key) return "No key set";
    if (key.length <= 8) return "••••••••";
    return `${key.substring(0, 4)}••••••••••••••••${key.substring(key.length - 4)}`;
  }

  return (
    <div className="min-h-screen w-full font-sans flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="w-full max-w-5xl mx-auto flex justify-between items-center mb-16">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            aria-label="Back to selection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter">Profile & Settings</h1>
        </div>
        <ProfilePopover user={user} onLogout={onLogout} onShowProfile={() => {}} />
      </header>
      
      <main className="flex-grow flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-8">
          <div className="section-card p-8">
            <h2 className="text-2xl font-bold text-[var(--text-color)] border-b border-slate-200 pb-4 mb-6">User Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted-color)]">Full Name</label>
                  {isEditingName ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setName(user.name);
                          }
                      }}
                      className="text-lg text-[var(--text-color)] mt-1 bg-slate-100 border border-teal-500 rounded-lg px-2 py-1 -ml-2 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <p className="text-lg text-[var(--text-color)] mt-1">{user.name}</p>
                  )}
                </div>
                {!isEditingName && (
                  <button onClick={() => setIsEditingName(true)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" aria-label="Edit name">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2-2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted-color)]">Email Address</label>
                <p className="text-lg text-[var(--text-color)] mt-1">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted-color)]">User ID</label>
                <p className="text-lg text-[var(--text-color)] mt-1 font-mono text-slate-600">{user.id}</p>
              </div>
            </div>
          </div>
          
          <div className="section-card p-8">
            <h2 className="text-2xl font-bold text-[var(--text-color)] border-b border-slate-200 pb-4 mb-6">API Key Management</h2>
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-muted-color)]">Current API Key</label>
                    <p className="text-lg text-[var(--text-color)] mt-1 font-mono text-slate-600 bg-slate-100 p-3 rounded-xl">{getMaskedApiKey(apiKey)}</p>
                </div>
                 <div>
                    <label htmlFor="api-key-update" className="block text-sm font-medium text-[var(--text-muted-color)]">Update API Key</label>
                    <input
                        id="api-key-update"
                        type="password"
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        placeholder="Paste new API key here to update"
                        className="mt-1 block w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={handleUpdateKey}
                disabled={!newApiKey.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center py-2.5 px-6 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                Save New Key
              </button>
              <button
                onClick={handleClearKeyClick}
                className="w-full sm:w-auto inline-flex items-center justify-center py-2.5 px-6 border border-slate-300 rounded-xl shadow-sm text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                Clear Saved Key
              </button>
              {keyUpdateStatus === 'success' && (
                <p className="text-sm text-green-600 animate-fade-in">API key updated successfully.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};