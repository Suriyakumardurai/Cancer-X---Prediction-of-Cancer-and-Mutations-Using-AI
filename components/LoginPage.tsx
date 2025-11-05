
import React, { useState } from 'react';
import type { User } from '../types';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => User | { error: string };
  onRegister: (name: string, email: string, pass: string) => User | { error: string };
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => { // Simulate network delay
        let result;
        if (isLoginView) {
            result = onLogin(email, password);
        } else {
            if (name.trim().length < 2) {
                setError("Name must be at least 2 characters.");
                setIsLoading(false);
                return;
            }
             if (password.length < 6) {
                setError("Password must be at least 6 characters.");
                setIsLoading(false);
                return;
            }
            result = onRegister(name, email, password);
        }
    
        if (result && 'error' in result) {
            setError(result.error);
        }
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-color)] text-[var(--text-color)] font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold text-teal-700 tracking-tighter">CancerX</h1>
            <p className="text-lg text-[var(--text-muted-color)] mt-2">AI-Powered Predictive Oncology Analysis</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-[var(--border-color)]">
          <div className="flex border-b border-[var(--border-color)] mb-6">
            <button 
              onClick={() => { setIsLoginView(true); setError(''); }}
              className={`flex-1 py-3 text-lg font-semibold transition-colors ${isLoginView ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLoginView(false); setError(''); }}
              className={`flex-1 py-3 text-lg font-semibold transition-colors ${!isLoginView ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLoginView && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted-color)]" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-[var(--border-color)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted-color)]" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-[var(--border-color)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted-color)]" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-[var(--border-color)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            
            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{error}</p>}

            <div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (isLoginView ? 'Login' : 'Create Account')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
