import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

// FIX: Replaced JSX.Element with React.ReactNode to fix "Cannot find namespace 'JSX'" error.
const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white/50 backdrop-blur-sm p-8 rounded-xl border border-stone-200/80 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 text-teal-600 mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-stone-800 mb-3">{title}</h3>
        <p className="text-stone-500">{children}</p>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full bg-[var(--bg-color)] text-[var(--text-color)] font-sans antialiased">
      <header className="absolute top-0 left-0 w-full z-10 p-6">
        <div className="max-w-screen-xl mx-auto">
            <span className="text-3xl font-bold text-teal-800">CancerX</span>
        </div>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 to-transparent"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl opacity-50"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500/50 rounded-full filter blur-3xl opacity-10"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-stone-800 tracking-tight">
                    AI-Powered Predictive Oncology Analysis
                </h1>
                <p className="mt-6 text-lg text-stone-600 max-w-2xl mx-auto">
                    A state-of-the-art platform assisting oncologists by providing a unified analysis of patient data from text reports and medical scans to accelerate and improve diagnostic accuracy.
                </p>
                <div className="mt-10">
                    <button 
                        onClick={onStart} 
                        className="px-8 py-4 text-lg font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500/50 shadow-lg"
                    >
                        Enter Analysis Environment
                    </button>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white/70 backdrop-blur-md px-4 sm:px-6 lg:px-8">
            <div className="max-w-screen-xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-stone-800">How It Works</h2>
                    <p className="mt-4 text-lg text-stone-500">A streamlined process from data intake to actionable insights.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        title="Multi-Modal Data Intake"
                    >
                        Securely upload patient pathology reports (PDF, DOCX) and medical scans (PNG, JPG) to create a comprehensive case file.
                    </FeatureCard>
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 00-4.137 1.639M9.75 3.104c.393 0 .786.023 1.17.068m-1.17-.068c.945.132 1.86.324 2.73.582m-2.73-.582V5.769m0 0A24.065 24.065 0 0012 5.5a24.065 24.065 0 00-2.25.269m2.25-.269a2.25 2.25 0 00-.659-1.591m0 0A24.013 24.013 0 0012 2.25c-2.748 0-5.36.43-7.687 1.207m15.374 0c.393 0 .786-.024 1.17-.068m-1.17.068a24.301 24.301 0 01-4.137-1.639m4.137 1.639c.945-.132 1.86-.324 2.73-.582m-2.73.582V5.769m0 0A24.065 24.065 0 0112 5.5a24.065 24.065 0 012.25-.269m-2.25.269a2.25 2.25 0 01.659 1.591m0 0v5.714m0 0a24.013 24.013 0 01-7.687-1.207m15.374 0c.393 0 .786.023 1.17.068m-1.17.068c-.945.132-1.86.324-2.73.582M12 14.25a.75.75 0 000-1.5.75.75 0 000 1.5z" /></svg>}
                        title="Advanced AI Analysis"
                    >
                        Our AI models extract key biomarkers, tumor characteristics, and clinical findings, identifying and outlining regions of interest on scans.
                    </FeatureCard>
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388m-5.18-3.32a.75.75 0 00-1.18-.472L3 15.75m0 0c.07.03.14.06.21.09a9.75 9.75 0 00-2.12 3.32M3 15.75V3m18 12.75a9.753 9.753 0 00-4.425-8.227" /></svg>}
                        title="Unified Synthesis & Chat"
                    >
                        The platform generates an integrated report correlating findings, and allows for conversational Q&A to explore the data more deeply.
                    </FeatureCard>
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-[var(--bg-color)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-xl mx-auto text-center text-stone-400 text-sm">
            <p>&copy; {new Date().getFullYear()} CancerX. For research and informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
};