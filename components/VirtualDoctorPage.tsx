
import React, { useState } from 'react';
import type { User, Case } from '../types';
import { ProfilePopover } from './ProfilePopover';

interface VirtualDoctorPageProps {
  user: User;
  cases: Case[];
  onLogout: () => void;
  onBack: () => void;
}

export const VirtualDoctorPage: React.FC<VirtualDoctorPageProps> = ({ user, cases, onLogout, onBack }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !phoneNumber) {
        setErrorMessage('Please select a case and enter a valid phone number.');
        setCallStatus('error');
        return;
    }

    setCallStatus('calling');
    setErrorMessage('');

    try {
      // This is where you send the data to your Python server endpoint.
      const response = await fetch('/api/initiate-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          caseId: selectedCaseId,
          phoneNumber: phoneNumber,
        }),
      });

      if (!response.ok) {
        // Try to get a more specific error from the backend response
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `Server responded with status: ${response.status}`);
      }

      setCallStatus('success');

    } catch (error) {
      setCallStatus('error');
      const message = error instanceof Error ? error.message : 'Failed to connect to the server.';
      // A user-friendly message for a common development error.
      if (message.includes('not found') || message.includes('Failed to fetch')) {
          setErrorMessage('Could not reach the call server. Please ensure the backend is running and accessible.');
      } else {
          setErrorMessage(message);
      }
    }
  };
  
  const getStatusMessage = () => {
      switch(callStatus) {
          case 'calling':
              return (
                  <div className="flex items-center justify-center text-lg text-slate-600">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Initiating call...
                  </div>
              );
          case 'success':
              return <p className="text-lg text-center text-teal-700 font-semibold">Call initiated successfully! You should receive a call shortly.</p>;
          case 'error':
              return <p className="text-lg text-center text-rose-600">{errorMessage}</p>;
          default:
              return null;
      }
  };

  return (
    <div className="min-h-screen w-full font-sans flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl mx-auto flex justify-between items-center mb-16">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            aria-label="Back to selection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter">Virtual AI Doctor</h1>
        </div>
        <ProfilePopover user={user} onLogout={onLogout} />
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="w-full max-w-lg">
            <div className="section-card p-8 sm:p-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-[var(--text-color)]">Initiate a Consultation Call</h2>
                    <p className="text-base text-[var(--text-muted-color)] mt-3">Select a case and enter your phone number. The AI assistant will call you to discuss the findings.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted-color)] mb-1" htmlFor="case-select">Select Patient Case</label>
                        <select
                            id="case-select"
                            value={selectedCaseId}
                            onChange={(e) => setSelectedCaseId(e.target.value)}
                            required
                            disabled={cases.length === 0}
                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
                        >
                            {cases.length > 0 ? (
                                cases.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)
                            ) : (
                                <option>No cases available. Please create one first.</option>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted-color)] mb-1" htmlFor="phone-number">Your Phone Number</label>
                        <input
                            id="phone-number"
                            type="tel"
                            placeholder="e.g., +14155552671"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={callStatus === 'calling' || cases.length === 0}
                            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            Initiate Call
                        </button>
                    </div>
                </form>

                <div className="mt-8 min-h-[2.25rem] flex items-center justify-center">
                    {getStatusMessage()}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};