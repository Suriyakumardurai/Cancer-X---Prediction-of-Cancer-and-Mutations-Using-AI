import React, { useEffect, useRef, useState } from 'react';
import type { Chart } from 'chart.js';

interface LandingPageProps {
    onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
    const unimodalChartRef = useRef<HTMLCanvasElement>(null);
    const benchmarkChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // --- Unimodal vs Multimodal Chart ---
        let unimodalChart: Chart | null = null;
        if (unimodalChartRef.current) {
            const unimodalCtx = unimodalChartRef.current.getContext('2d');
            if (unimodalCtx) {
                unimodalChart = new (window as any).Chart(unimodalCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Unimodal Models', 'Multimodal Models'],
                        datasets: [{
                            label: 'Median AUC',
                            data: [0.83, 0.88],
                            backgroundColor: ['rgba(251, 146, 60, 0.6)', 'rgba(20, 184, 166, 0.6)'],
                            borderColor: ['rgba(251, 146, 60, 1)', 'rgba(20, 184, 166, 1)'],
                            borderWidth: 1,
                            borderRadius: 5,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true, max: 1.0, title: { display: true, text: 'Median AUC Score' } } },
                        plugins: { title: { display: true, text: 'Multimodal Performance Gain', font: { size: 16 } }, legend: { display: false } }
                    }
                });
            }
        }
        
        // --- Interactive Benchmark Chart Logic ---
        const benchmarkData = {
            'Treatment Response (pCR)': {
                'AUC': [
                    { label: 'CNN-based (MRI+Clinical)', value: 0.88, context: 'Median AUC from a 2025 systematic review of 51 studies.' },
                    { label: 'CNN/LSTM (Longitudinal MRI)', value: 0.91, context: 'Median AUC when using scans from multiple time points, showing the value of longitudinal data.' },
                    { label: 'Vision-Mamba (Pre-treatment CT)', value: 0.92, context: 'A newer architecture outperforming baselines on esophageal cancer data.' }
                ]
            },
            'Survival Prediction': {
                'C-Index': [{ label: 'HEALNet (WSI+Omics)', value: 0.812, context: 'State-of-the-art fusion on TCGA kidney cancer cohort.' }],
                'Hazard Ratio': [{ label: 'PathGNN (Radiology+Pathology)', value: 3.314, context: 'GNN model for glioma, indicating strong separation of risk groups.' }]
            },
            'Cancer Staging': { 'AUC': [{ label: 'Neural Network (Multi-omics)', value: 0.93, context: 'Predicting early vs. late stage in papillary renal cell carcinoma.' }] },
            'Gene Mutation': {
                'AUC': [{ label: 'Random Forest (MRI+Clinical)', value: 0.91, context: 'Predicting FOXA1 mutations in prostate cancer.' }],
                'Sensitivity': [{ label: 'CNN (WSI for ALK)', value: 0.80, context: 'Predicting ALK mutation in NSCLC from slides.' }, { label: 'CNN (WSI for EGFR)', value: 0.78, context: 'Predicting EGFR mutation in NSCLC from slides.' }],
                'Specificity': [{ label: 'CNN (WSI for ALK)', value: 0.85, context: 'Predicting ALK mutation in NSCLC from slides.' }, { label: 'CNN (WSI for EGFR)', value: 0.74, context: 'Predicting EGFR mutation in NSCLC from slides.' }]
            }
        };

        const taskFilter = document.getElementById('taskFilter') as HTMLSelectElement;
        const metricFilter = document.getElementById('metricFilter') as HTMLSelectElement;
        const chartTitle = document.getElementById('chartTitle');
        const chartContextEl = document.getElementById('chartContext');
        
        function populateMetricFilter(task: string) {
            const metrics = Object.keys(benchmarkData[task as keyof typeof benchmarkData]);
            metricFilter.innerHTML = '';
            metrics.forEach(metric => {
                const option = document.createElement('option');
                option.value = metric;
                option.textContent = metric;
                metricFilter.appendChild(option);
            });
        }

        function updateChart() {
            if (!benchmarkChartRef.current || !taskFilter || !metricFilter || !chartTitle || !chartContextEl) return;
            
            const selectedTask = taskFilter.value as keyof typeof benchmarkData;
            const selectedMetric = metricFilter.value;

            const taskData = benchmarkData[selectedTask];

            if (!taskData || !(selectedMetric in taskData)) {
                if (chartInstanceRef.current) chartInstanceRef.current.destroy();
                chartTitle.textContent = 'No data available for this selection.';
                chartContextEl.textContent = '';
                if (benchmarkChartRef.current) {
                    const context = benchmarkChartRef.current.getContext('2d');
                    if (context) {
                        context.clearRect(0, 0, benchmarkChartRef.current.width, benchmarkChartRef.current.height);
                    }
                }
                return;
            }

            const data = (taskData as Record<string, { label: string; value: number; context: string; }[]>)[selectedMetric];
            const labels = data.map(d => d.label.split(' ').map(word => word.length > 15 ? word.substring(0, 15) + '...' : word).join(' '));
            const values = data.map(d => d.value);

            chartTitle.textContent = `Performance for: ${selectedTask}`;
            chartContextEl.textContent = `Metric: ${selectedMetric}. Hover over bars for details on each model.`;
            
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: selectedMetric,
                        data: values,
                        backgroundColor: 'rgba(13, 148, 136, 0.6)',
                        borderColor: 'rgba(13, 148, 136, 1)',
                        borderWidth: 1,
                        borderRadius: 5,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { beginAtZero: true, grid: { color: '#e7e5e4' }, ticks: { color: '#57534e' } },
                        y: { grid: { display: false }, ticks: { color: '#57534e', autoSkip: false, callback: function(value: any, index: any, values: any) { const label = this.getLabelForValue(value); return label.length > 20 ? label.match(/.{1,20}/g) : label; } } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { afterBody: (context: any) => { 
                            const dataIndex = context[0].dataIndex; 
                            const itemContext = data[dataIndex].context; 
                            return itemContext.match(/.{1,40}/g) || ''; } } }
                    }
                }
            };

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            chartInstanceRef.current = new (window as any).Chart(benchmarkChartRef.current, chartConfig);
        }
        
        if (taskFilter && metricFilter) {
            taskFilter.addEventListener('change', () => {
                populateMetricFilter(taskFilter.value);
                updateChart();
            });
            metricFilter.addEventListener('change', updateChart);
            populateMetricFilter(taskFilter.value);
            updateChart();
        }

        // --- Tab Logic ---
        const tabs = document.querySelectorAll('.tab-button');
        const panels = document.querySelectorAll('.model-panel');
        const tabClickHandler = (event: Event) => {
            const tab = event.currentTarget as HTMLElement;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            panels.forEach(panel => {
                if (panel.id === `${target}-content`) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        };
        tabs.forEach(tab => tab.addEventListener('click', tabClickHandler));
        
        // --- NavLink Intersection Observer ---
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('main section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href')!.substring(1) === entry.target.id);
                    });
                }
            });
        }, { rootMargin: "-50% 0px -50% 0px" });
        sections.forEach(section => observer.observe(section));

        // --- Manual Smooth Scroll for Anchor Links ---
        const handleAnchorClick = (e: Event) => {
            e.preventDefault();
            setIsMenuOpen(false); // Close menu on click
            const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
            if (targetId) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        };
        document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', handleAnchorClick));


        return () => {
            if (unimodalChart) unimodalChart.destroy();
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            tabs.forEach(tab => tab.removeEventListener('click', tabClickHandler));
            observer.disconnect();
            document.querySelectorAll('a[href^="#"]').forEach(link => link.removeEventListener('click', handleAnchorClick));
        };

    }, []);


    return (
        <div className="bg-[var(--bg-color)]">
            <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm border-b border-stone-200">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-teal-800">CancerX</h1>
                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center md:space-x-6 lg:space-x-8 text-stone-600 font-medium">
                        <a href="#core-idea" className="nav-link whitespace-nowrap">The Core Idea</a>
                        <a href="#data-modalities" className="nav-link whitespace-nowrap">Data Modalities</a>
                        <a href="#technology" className="nav-link">Technology</a>
                        <a href="#benchmarks" className="nav-link">Benchmarks</a>
                        <a href="#roadmap" className="nav-link">Roadmap</a>
                        <button onClick={onLaunch} className="bg-teal-600 text-white font-medium py-2 px-5 rounded-full hover:bg-teal-700 transition-colors whitespace-nowrap">
                            Launch App
                        </button>
                    </div>
                     {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Open menu">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                </nav>
                 {/* Mobile Menu */}
                <div className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-lg shadow-md ${isMenuOpen ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col items-center space-y-4 p-5">
                        <a href="#core-idea" className="nav-link text-stone-600 font-medium">The Core Idea</a>
                        <a href="#data-modalities" className="nav-link text-stone-600 font-medium">Data Modalities</a>
                        <a href="#technology" className="nav-link text-stone-600 font-medium">Technology</a>
                        <a href="#benchmarks" className="nav-link text-stone-600 font-medium">Benchmarks</a>
                        <a href="#roadmap" className="nav-link text-stone-600 font-medium">Roadmap</a>
                        <button onClick={() => { onLaunch(); setIsMenuOpen(false); }} className="mt-4 w-full bg-teal-600 text-white font-medium py-2.5 px-5 rounded-full hover:bg-teal-700 transition-colors">
                            Launch App
                        </button>
                    </div>
                </div>
            </header>

            <main>
                <section id="hero" className="py-20 md:py-32 bg-white">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-4xl md:text-6xl font-bold text-stone-800 leading-tight">Predictive Analysis of Cancer and Health</h2>
                        <p className="mt-6 text-lg md:text-xl text-stone-600 max-w-3xl mx-auto">An interactive exploration of the CancerX project, a vision for a next-generation predictive system using multimodal AI to revolutionize oncology.</p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={onLaunch} className="w-full sm:w-auto bg-teal-600 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-700 transition-transform transform hover:scale-105">
                                Launch Analysis Environment
                            </button>
                             <a href="#core-idea" className="w-full sm:w-auto font-bold py-3 px-8 rounded-full text-teal-700 bg-transparent border-2 border-teal-600 hover:bg-teal-50/50 transition-colors">
                                Explore the Research
                            </a>
                        </div>
                    </div>
                </section>

                <section id="core-idea" className="py-16 md:py-24">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold text-stone-800">The Multimodal Imperative</h3>
                            <p className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto">This application explores the foundational argument of the CancerX report: a multimodal approach is not just an improvement but a necessity for modern precision oncology. By integrating diverse data, AI can create a holistic disease profile, far surpassing the limitations of any single data source.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div className="section-card p-6">
                                <h4 className="text-2xl font-semibold text-stone-700 mb-4">Unimodal vs. Multimodal</h4>
                                <p className="text-stone-600 mb-6">The literature is clear: models that fuse multiple data types (like images and text) consistently outperform those relying on a single source. This fusion allows the model to build a more complete, robust, and accurate picture of a tumor's biology.</p>
                                <div className="relative w-full h-64 max-h-[300px] mx-auto">
                                    <canvas ref={unimodalChartRef} id="unimodalVsMultimodalChart"></canvas>
                                </div>
                                <p className="text-xs text-center mt-2 text-stone-500">Source: 2025 systematic review on pCR prediction in breast cancer.</p>
                            </div>
                            <div className="section-card p-6">
                                <h4 className="text-2xl font-semibold text-stone-700 mb-4">Emulating Clinical Expertise</h4>
                                <p className="text-stone-600 mb-6">A multimodal system mirrors how expert clinicians work. A doctor doesn't rely on just one test; they synthesize information from patient history, lab results, and multiple scans. AI that does the same achieves greater robustness and generalizability, making predictions more reliable in the face of real-world data imperfections.</p>
                                <div className="p-4 sm:p-6 bg-teal-50/50 border border-teal-200 rounded-lg">
                                    <div className="flex flex-wrap items-center justify-center sm:space-x-4">
                                        <span className="text-4xl">🔬</span>
                                        <span className="text-2xl font-light text-teal-400 mx-2">+</span>
                                        <span className="text-4xl">📄</span>
                                        <span className="text-2xl font-light text-teal-400 mx-2">+</span>
                                        <span className="text-4xl">🧬</span>
                                        <span className="text-2xl font-light text-teal-400 mx-2">=</span>
                                        <div className="text-center mt-2 sm:mt-0">
                                            <span className="text-2xl font-bold text-teal-700">Holistic View</span>
                                            <p className="text-sm text-teal-600">Enhanced Prediction</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-stone-600">This integration links genotype to phenotype, providing a richer understanding than any single modality could achieve alone.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="data-modalities" className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold text-stone-800">The Pillars of Prediction: Data Modalities</h3>
                            <p className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto">The power of CancerX comes from integrating diverse, complementary data sources. Each modality provides a unique window into the tumor's biology. Explore the key data types that form the foundation of this multimodal approach.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="section-card text-center p-6">
                                <span className="text-5xl mb-4 block">🩺</span>
                                <h4 className="text-xl font-semibold text-stone-700">Radiological Imaging</h4>
                                <p className="mt-2 text-stone-600">Non-invasive views (MRI, CT, PET) that capture a tumor's size, shape, and location, forming the basis of radiomics.</p>
                            </div>
                            <div className="section-card text-center p-6">
                                <span className="text-5xl mb-4 block">🔬</span>
                                <h4 className="text-xl font-semibold text-stone-700">Digital Histopathology</h4>
                                <p className="mt-2 text-stone-600">High-resolution scans of tissue samples (WSIs) that reveal cellular architecture, the gold standard for diagnosis.</p>
                            </div>
                            <div className="section-card text-center p-6">
                                <span className="text-5xl mb-4 block">📝</span>
                                <h4 className="text-xl font-semibold text-stone-700">Unstructured Clinical Text</h4>
                                <p className="mt-2 text-stone-600">Rich narratives from pathology/radiology reports containing critical diagnostic details, staging, and biomarker status.</p>
                            </div>
                            <div className="section-card text-center p-6">
                                <span className="text-5xl mb-4 block">🧬</span>
                                <h4 className="text-xl font-semibold text-stone-700">Multi-Omics Data</h4>
                                <p className="mt-2 text-stone-600">Deep molecular data (genomics, transcriptomics) that identifies the specific genetic drivers of a cancer.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="technology" className="py-16 md:py-24">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h3 className="text-3xl md:text-4xl font-bold text-stone-800">The Engine: AI Architectures & Fusion</h3>
                     <p className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto">This section explores the core technologies powering CancerX. We'll look at the evolution of AI models used for analyzing medical data and the critical techniques for fusing these different information streams into a single, powerful prediction.</p>
                </div>

                <div className="section-card p-6 mb-8">
                    <h4 className="text-2xl font-semibold text-stone-700 mb-6 text-center">Foundational AI Models</h4>
                    <div id="model-tabs" className="mb-6 flex flex-wrap justify-center gap-2 md:gap-4">
                        <button data-tab="vision" className="tab-button px-4 py-2 rounded-full font-medium text-sm md:text-base bg-stone-100 text-stone-700 active">Vision Models</button>
                        <button data-tab="nlp" className="tab-button px-4 py-2 rounded-full font-medium text-sm md:text-base bg-stone-100 text-stone-700">Language Models</button>
                        <button data-tab="advanced" className="tab-button px-4 py-2 rounded-full font-medium text-sm md:text-base bg-stone-100 text-stone-700">Advanced Architectures</button>
                    </div>
                    <div id="model-content" className="p-4 md:p-6 bg-stone-50 rounded-lg border border-stone-200 min-h-[200px]">
                        <div id="vision-content" className="model-panel">
                            <h5 className="font-bold text-lg text-teal-800">From CNNs to Vision Transformers (ViTs)</h5>
                            <p className="mt-2 text-stone-600">The field has evolved from Convolutional Neural Networks (CNNs), which are excellent at detecting local patterns, to Vision Transformers (ViTs). ViTs analyze an image globally, capturing long-range dependencies between different regions. This is crucial for understanding the complex, heterogeneous landscape of a tumor, mirroring how a pathologist assesses overall tissue architecture.</p>
                        </div>
                        <div id="nlp-content" className="model-panel hidden">
                            <h5 className="font-bold text-lg text-teal-800">Unlocking Clinical Text with Transformers</h5>
                            <p className="mt-2 text-stone-600">A wealth of critical data is locked in free-text reports. Transformer-based models like BERT and GPT are revolutionary for this task. They automate Information Extraction—identifying key entities like TNM staging and biomarkers—with high accuracy, often matching human experts without any specific retraining (zero-shot extraction).</p>
                        </div>
                        <div id="advanced-content" className="model-panel hidden">
                           <h5 className="font-bold text-lg text-teal-800">Specialized Models for Biomedical Data</h5>
                            <p className="mt-2 text-stone-600">Beyond the basics, specialized architectures excel at specific tasks. <strong>Graph Neural Networks (GNNs)</strong> are ideal for modeling relationships, like gene interactions in biological pathways. <strong>State-Space Models (e.g., Mamba)</strong> are highly efficient at processing very long data sequences, such as the pixels in a high-resolution pathology slide, outperforming other models in certain tasks.</p>
                        </div>
                    </div>
                </div>

                <div className="section-card p-6">
                    <h4 className="text-2xl font-semibold text-stone-700 mb-6 text-center">The Art of Fusion: Combining Data Streams</h4>
                    <p className="text-center text-stone-600 mb-8 max-w-2xl mx-auto">The most critical technical challenge is how to combine, or "fuse," the different data types. The strategy chosen dramatically impacts performance.</p>
                    <div className="flex flex-col md:flex-row justify-around items-center gap-4">
                        <div className="text-center p-4">
                            <h5 className="font-semibold text-lg">Early Fusion</h5>
                            <p className="text-sm text-stone-500">Combine at input</p>
                            <div className="mt-2 p-2 border-2 border-dashed border-sky-300 rounded-lg">
                                <span className="text-2xl">🔬</span> + <span className="text-2xl">📝</span> → <span className="font-bold text-sky-600">Model</span>
                            </div>
                        </div>
                        <div className="text-center p-4 border-4 border-teal-500 rounded-xl shadow-lg">
                            <h5 className="font-semibold text-lg text-teal-700">Intermediate Fusion</h5>
                            <p className="text-sm text-stone-500">(Most Effective)</p>
                             <div className="mt-2 p-2">
                                <span className="text-2xl">🔬</span>→<span className="font-bold text-teal-600">Enc</span> + <span className="text-2xl">📝</span>→<span className="font-bold text-teal-600">Enc</span> → <span className="font-bold text-teal-600">Fuse</span>
                            </div>
                        </div>
                        <div className="text-center p-4">
                            <h5 className="font-semibold text-lg">Late Fusion</h5>
                            <p className="text-sm text-stone-500">Combine at output</p>
                            <div className="mt-2 p-2 border-2 border-dashed border-amber-400 rounded-lg">
                                <span className="font-bold text-amber-600">Model</span> + <span className="font-bold text-amber-600">Model</span> → <span className="text-2xl">Vote</span>
                            </div>
                        </div>
                    </div>
                     <p className="text-center text-stone-600 mt-8 max-w-3xl mx-auto">While Early and Late fusion have their uses, <strong>Intermediate Fusion</strong> is the state-of-the-art. It allows for deep, modality-specific learning before fusing rich feature representations, enabling the model to learn complex interactions and achieve the best performance.</p>
                </div>
            </div>
        </section>

        <section id="benchmarks" className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h3 className="text-3xl md:text-4xl font-bold text-stone-800">Interactive Performance Benchmarks</h3>
                    <p className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto">How well do these models actually perform? This interactive dashboard visualizes the state-of-the-art performance metrics reported in the literature (2022-2024). Use the filters to explore the data for different predictive tasks and evaluation metrics.</p>
                </div>

                <div className="section-card p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <div className="flex-1">
                            <label htmlFor="taskFilter" className="block text-sm font-medium text-stone-700">Predictive Task</label>
                            <select id="taskFilter" className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-stone-800 border-stone-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                                <option value="Treatment Response (pCR)">Treatment Response (pCR)</option>
                                <option value="Survival Prediction">Survival Prediction</option>
                                <option value="Cancer Staging">Cancer Staging</option>
                                <option value="Gene Mutation">Gene Mutation</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="metricFilter" className="block text-sm font-medium text-stone-700">Performance Metric</label>
                            <select id="metricFilter" className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-stone-800 border-stone-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                                {/* Options will be populated by JS */}
                            </select>
                        </div>
                    </div>

                    <h4 id="chartTitle" className="text-xl font-semibold text-stone-700 mb-4 text-center"></h4>
                    <div className="relative w-full mx-auto max-w-[800px] h-[45vh] max-h-[500px]">
                        <canvas ref={benchmarkChartRef} id="benchmarkChart"></canvas>
                    </div>
                    <p id="chartContext" className="text-sm text-center mt-4 text-stone-500"></p>
                </div>
            </div>
        </section>

        <section id="roadmap" className="py-16 md:py-24">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h3 className="text-3xl md:text-4xl font-bold text-stone-800">Roadmap to Impact</h3>
                    <p className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto">Translating this research into a high-impact IEEE publication requires a clear strategy. The goal is to move beyond simply using multimodal data to tackling a frontier problem with a novel, robust, and generalizable solution.</p>
                </div>

                <div className="relative">
                    {/* Desktop Timeline Line */}
                    <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 h-full w-0.5 bg-teal-200"></div>
                    
                    <div className="space-y-12">
                        {/* Item 1 */}
                        <div className="md:grid md:grid-cols-2 md:gap-8 items-center relative">
                            <div className="md:text-right md:pr-8 mb-4 md:mb-0">
                                <h4 className="text-2xl font-bold text-teal-700">1. Tackle a Frontier Problem</h4>
                            </div>
                            <div className="md:pl-8">
                                <div className="section-card p-6">
                                    <p className="text-stone-600">The most promising angle for novelty is to focus on <strong>predictive radiogenomics using longitudinal data</strong>. This means forecasting future cancer progression and mutation risk over time, a clear gap in the current literature with immense clinical potential.</p>
                                </div>
                            </div>
                        </div>
                        {/* Item 2 */}
                        <div className="md:grid md:grid-cols-2 md:gap-8 items-center relative">
                            <div className="md:pl-8 md:col-start-2">
                                <h4 className="text-2xl font-bold text-teal-700 md:text-left">2. Innovate in Architecture</h4>
                            </div>
                            <div className="md:text-right md:pr-8 md:row-start-1">
                                <div className="section-card p-6">
                                    <p className="text-stone-600">Propose a novel fusion architecture specifically for image and text data. This could be a hybrid model (e.g., ViT-GNN) or an adaptation of a state-of-the-art method like HEALNet, demonstrating superior performance and robustness.</p>
                                </div>
                            </div>
                        </div>
                         {/* Item 3 */}
                        <div className="md:grid md:grid-cols-2 md:gap-8 items-center relative">
                           <div className="md:text-right md:pr-8 mb-4 md:mb-0">
                                <h4 className="text-2xl font-bold text-teal-700">3. Ensure Robust Validation</h4>
                            </div>
                            <div className="md:pl-8">
                                <div className="section-card p-6">
                                    <p className="text-stone-600">The primary contribution could be addressing clinical translation. This involves designing a system robust to real-world data issues (like missing modalities) and, crucially, validating it on an <strong>external, multi-center dataset</strong> to prove generalizability.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
            </main>

            <footer className="bg-white border-t border-stone-200">
                <div className="container mx-auto px-6 py-8 text-center text-stone-500">
                    <p>&copy; 2025 CancerX Project. An interactive summary based on the literature review.</p>
                    <p className="text-sm mt-2">This application is for informational purposes only and does not constitute medical advice.</p>
                </div>
            </footer>
        </div>
    );
};
