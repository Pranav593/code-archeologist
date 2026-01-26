'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    FileText, 
    Pickaxe, 
    Layers, 
    Settings, 
    ArrowLeft,
    Terminal,
    Rocket,
    GitBranch,
    Database,
    Zap,
    ChevronRight,
    CheckCircle2,
    Book,
    Code2,
    Server,
    Play,
    Folder,
    ExternalLink,
    Copy,
    Shield
} from 'lucide-react';

const sections = ['getting-started', 'architecture', 'usage', 'api', 'troubleshooting'];

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('getting-started');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-20% 0px -60% 0px',
                threshold: 0
            }
        );

        sections.forEach((sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                                <Pickaxe className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">Code Archeologist</h1>
                                <p className="text-xs text-gray-500">Documentation</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1">
                        <Link href="/" className="btn-ghost text-sm rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                            <Layers className="w-4 h-4 mr-1.5 inline" />
                            Graph
                        </Link>
                        <span className="btn-ghost text-sm rounded-lg px-3 py-2 bg-indigo-50 text-indigo-700">
                            <FileText className="w-4 h-4 mr-1.5 inline" />
                            Docs
                        </span>
                        <Link href="/settings" className="btn-ghost text-sm rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                            <Settings className="w-4 h-4 mr-1.5 inline" />
                            Settings
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex gap-10">
                    {/* Sidebar Navigation */}
                    <aside className="w-56 shrink-0 hidden lg:block">
                        <nav className="sticky top-24 space-y-1">
                            <a 
                                href="#getting-started" 
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    activeSection === 'getting-started' 
                                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Rocket className={`w-4 h-4 ${activeSection === 'getting-started' ? 'text-indigo-600' : ''}`} />
                                Getting Started
                            </a>
                            <a 
                                href="#architecture" 
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    activeSection === 'architecture' 
                                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Code2 className={`w-4 h-4 ${activeSection === 'architecture' ? 'text-indigo-600' : ''}`} />
                                Architecture
                            </a>
                            <a 
                                href="#usage" 
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    activeSection === 'usage' 
                                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Play className={`w-4 h-4 ${activeSection === 'usage' ? 'text-indigo-600' : ''}`} />
                                Usage Guide
                            </a>
                            <a 
                                href="#api" 
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    activeSection === 'api' 
                                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Server className={`w-4 h-4 ${activeSection === 'api' ? 'text-indigo-600' : ''}`} />
                                API Reference
                            </a>
                            <a 
                                href="#troubleshooting" 
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    activeSection === 'troubleshooting' 
                                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Shield className={`w-4 h-4 ${activeSection === 'troubleshooting' ? 'text-indigo-600' : ''}`} />
                                Troubleshooting
                            </a>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-8">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Graph
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation</h1>
                            <p className="text-gray-600">Learn how to use Code Archeologist to heal your legacy codebase</p>
                        </div>

                        <div className="space-y-12 prose-modern">
                            {/* Getting Started */}
                            <section id="getting-started" className="scroll-mt-24">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <Rocket className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 !mt-0 !mb-0">Getting Started</h2>
                                </div>

                                <div className="card p-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                Docker and Docker Compose installed
                                            </li>
                                            <li className="flex items-center gap-2 text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                Node.js 18+ for frontend development
                                            </li>
                                            <li className="flex items-center gap-2 text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                Python 3.10+ for backend development
                                            </li>
                                            <li className="flex items-center gap-2 text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                Gemini API key for AI features
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Start with Docker</h3>
                                        <p className="text-gray-600 mb-4">The easiest way to run Code Archeologist is using Docker Compose:</p>
                                        
                                        <div className="bg-slate-900 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
                                                <span className="text-xs text-slate-400">Terminal</span>
                                                <button 
                                                    onClick={() => copyToClipboard('docker-compose up --build')}
                                                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                                                    title="Copy"
                                                >
                                                    <Copy className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </div>
                                            <div className="p-4 text-sm overflow-x-auto font-mono">
                                                <span className="text-emerald-400">docker-compose up --build</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500 mt-3">
                                            This will start both the backend API server and the frontend dashboard.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Manual Setup</h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">1</span>
                                                    Backend Setup
                                                </h4>
                                                <div className="bg-slate-900 rounded-lg overflow-hidden ml-8">
                                                    <div className="p-4 text-sm overflow-x-auto font-mono text-slate-300 whitespace-pre-wrap">{`cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python server.py`}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">2</span>
                                                    Frontend Setup
                                                </h4>
                                                <div className="bg-slate-900 rounded-lg overflow-hidden ml-8">
                                                    <div className="p-4 text-sm overflow-x-auto font-mono text-slate-300 whitespace-pre-wrap">{`cd frontend
npm install
npm run dev`}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">3</span>
                                                    Open the Dashboard
                                                </h4>
                                                <p className="text-gray-600 ml-8">
                                                    Navigate to{' '}
                                                    <a href="http://localhost:3000" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                        http://localhost:3000
                                                        <ExternalLink className="w-3 h-3 inline ml-1" />
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Architecture */}
                            <section id="architecture" className="scroll-mt-24">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                        <Code2 className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 !mt-0 !mb-0">Architecture</h2>
                                </div>

                                <div className="card p-6 space-y-6">
                                    <p className="text-gray-600">
                                        Code Archeologist is built as a monorepo with a Python backend and Next.js frontend.
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Server className="w-5 h-5 text-blue-600" />
                                                <h4 className="font-semibold text-blue-900">Backend (Python)</h4>
                                            </div>
                                            <ul className="space-y-1 text-sm text-blue-800">
                                                <li>• FastAPI server with WebSocket support</li>
                                                <li>• Tree-sitter for AST parsing</li>
                                                <li>• ChromaDB for vector storage</li>
                                                <li>• Gemini AI for code analysis</li>
                                                <li>• Git integration for safe changes</li>
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Layers className="w-5 h-5 text-green-600" />
                                                <h4 className="font-semibold text-green-900">Frontend (Next.js)</h4>
                                            </div>
                                            <ul className="space-y-1 text-sm text-green-800">
                                                <li>• React 19 with TypeScript</li>
                                                <li>• 3D force-directed graph visualization</li>
                                                <li>• Real-time WebSocket updates</li>
                                                <li>• Tailwind CSS styling</li>
                                                <li>• Syntax highlighting for code</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Project Structure</h4>
                                        <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-slate-300">
                                            <pre>{`code-archeologist/
├── backend/
│   ├── server.py          # FastAPI server
│   ├── core.py            # Main orchestration
│   ├── languages/         # Language-specific parsers
│   └── pipeline/          # Analysis pipeline phases
├── frontend/
│   ├── app/
│   │   ├── page.tsx       # Main dashboard
│   │   ├── docs/          # Documentation
│   │   └── settings/      # Settings page
│   └── components/        # Reusable components
├── test_codebase/         # Sample codebase for testing
└── docker-compose.yml     # Docker orchestration`}</pre>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Usage Guide */}
                            <section id="usage" className="scroll-mt-24">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                        <Play className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 !mt-0 !mb-0">Usage Guide</h2>
                                </div>

                                <div className="card p-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Initial Analysis</h3>
                                        <p className="text-gray-600">
                                            When you first open the dashboard, click "Start Analysis" on the landing page. 
                                            This will scan your codebase, parse all supported files, calculate complexity metrics, 
                                            and build a 3D dependency graph.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Exploring the Graph</h3>
                                        <p className="text-gray-600 mb-3">
                                            The 3D graph shows your code structure with nodes representing functions, classes, and methods:
                                        </p>
                                        <ul className="space-y-2 text-gray-600">
                                            <li className="flex items-start gap-2">
                                                <div className="w-3 h-3 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                                                <span><strong>Violet</strong> - Extreme complexity (&gt;35)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                                <span><strong>Red</strong> - High complexity (&gt;20)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-3 h-3 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                                <span><strong>Orange</strong> - Medium complexity (&gt;10)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                                <span><strong>Green</strong> - Low complexity (≤10)</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">3. AI-Powered Refactoring</h3>
                                        <p className="text-gray-600 mb-3">
                                            Click on any node to inspect its code. From the side panel, you can:
                                        </p>
                                        <ul className="space-y-2 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                <span><strong>Explain</strong> - Get an AI-generated explanation of the code</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                <span><strong>Refactor</strong> - Let AI suggest and implement improvements</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                <span><strong>Review</strong> - See the diff before merging changes</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Safe Branching</h3>
                                        <p className="text-gray-600">
                                            All AI-generated changes are created on separate Git branches. You can review 
                                            the diff, approve and merge, or discard the changes. This ensures your main 
                                            branch is never modified without your explicit approval.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* API Reference */}
                            <section id="api" className="scroll-mt-24">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                        <Server className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 !mt-0 !mb-0">API Reference</h2>
                                </div>

                                <div className="card p-6 space-y-4">
                                    <p className="text-gray-600">
                                        The backend exposes a REST API at <code className="bg-gray-100 px-2 py-0.5 rounded">http://localhost:8000</code>
                                    </p>

                                    <div className="space-y-3">
                                        {[
                                            { method: 'GET', path: '/status', desc: 'Check if analysis has been run' },
                                            { method: 'POST', path: '/analyze', desc: 'Trigger full codebase analysis' },
                                            { method: 'GET', path: '/graph', desc: 'Get the dependency graph data' },
                                            { method: 'POST', path: '/search', desc: 'Search nodes by query' },
                                            { method: 'POST', path: '/explain', desc: 'Get AI explanation for a node' },
                                            { method: 'POST', path: '/heal', desc: 'Trigger AI refactoring for a node' },
                                            { method: 'POST', path: '/git/diff', desc: 'Get diff for a branch' },
                                            { method: 'POST', path: '/git/merge', desc: 'Merge a branch into main' },
                                            { method: 'POST', path: '/git/discard', desc: 'Discard a branch' },
                                            { method: 'POST', path: '/reset', desc: 'Reset all analysis data' },
                                        ].map((endpoint, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                    endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {endpoint.method}
                                                </span>
                                                <code className="text-sm text-gray-900 font-mono">{endpoint.path}</code>
                                                <span className="text-sm text-gray-500 ml-auto">{endpoint.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Troubleshooting */}
                            <section id="troubleshooting" className="scroll-mt-24">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-red-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 !mt-0 !mb-0">Troubleshooting</h2>
                                </div>

                                <div className="card p-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Backend not connecting</h3>
                                        <p className="text-gray-600 mb-2">
                                            Make sure the backend server is running on port 8000. Check Docker logs:
                                        </p>
                                        <div className="bg-slate-900 rounded-lg p-3 text-sm text-slate-300 font-mono">
                                            docker-compose logs backend
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Graph is empty</h3>
                                        <p className="text-gray-600">
                                            Click "Re-analyze" in the header to trigger a fresh scan. Make sure your 
                                            target codebase directory is properly mounted in Docker.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI features not working</h3>
                                        <p className="text-gray-600">
                                            Verify your Gemini API key is set in the environment variables. Check the 
                                            backend logs for API errors.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset everything</h3>
                                        <p className="text-gray-600 mb-2">
                                            Go to Settings → Danger Zone → Reset System, or manually clear the data:
                                        </p>
                                        <div className="bg-slate-900 rounded-lg p-3 text-sm text-slate-300 font-mono">
                                            rm -rf chroma_data/* && docker-compose restart
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white mt-20">
                <div className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
                    <p>Code Archeologist — AI-powered legacy code healing</p>
                </div>
            </footer>
        </div>
    );
}
