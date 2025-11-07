import React, { useState } from 'react';
import type { User } from '../types';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => User | { error: string };
  onRegister: (name: string, email: string, pass: string) => void | { error: string };
}

const InputField: React.FC<{id: string, type: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, icon: React.ReactNode, required?: boolean}> = 
  ({ id, type, placeholder, value, onChange, icon, required }) => (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="block w-full pl-12 pr-4 py-3 bg-slate-100 border border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
      />
    </div>
);

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
    <div className="min-h-screen w-full bg-slate-50 font-sans flex animate-fade-in">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-teal-500 to-teal-700 flex-col items-center justify-center p-12 text-white text-center relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-white/10 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="relative z-10">
          <h1 className="text-6xl font-extrabold tracking-tighter">CancerX</h1>
          <p className="text-xl mt-4 opacity-90 max-w-sm">AI-Powered Predictive Oncology Analysis. Unify data, accelerate diagnosis.</p>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
              <h1 className="text-5xl font-extrabold text-teal-700 tracking-tighter">CancerX</h1>
              <p className="text-lg text-[var(--text-muted-color)] mt-2">AI-Powered Predictive Oncology Analysis</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/80">
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button 
                onClick={() => { setIsLoginView(true); setError(''); }}
                className={`flex-1 py-2.5 text-base font-semibold transition-colors rounded-lg ${isLoginView ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Login
              </button>
              <button 
                onClick={() => { setIsLoginView(false); setError(''); }}
                className={`flex-1 py-2.5 text-base font-semibold transition-colors rounded-lg ${!isLoginView ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLoginView && (
                <InputField id="name" type="text" placeholder="Dr. Jane Smith" value={name} onChange={e => setName(e.target.value)} required 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>} 
                />
              )}
              <InputField id="email" type="email" placeholder="jane.smith@hospital.org" value={email} onChange={e => setEmail(e.target.value)} required
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>}
              />
               <InputField id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
              />
              
              {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{error}</p>}

              <div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all transform hover:scale-105"
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
    </div>
  );
};