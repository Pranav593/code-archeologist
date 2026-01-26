'use client';

import React, { useState } from 'react';
import { 
    Pickaxe, 
    Play, 
    Server, 
    Database, 
    Sparkles,
    Zap,
    Shield,
    GitBranch,
    ArrowRight,
    CheckCircle2,
    Code2,
    Layers,
    Brain,
    Edit2,
    Save, 
    X,
    RefreshCw
} from 'lucide-react';
import TerminalOutput from './Terminal';

interface LandingPageProps {
    onAnalysisComplete: () => void;
}

const API_URL = 'http://127.0.0.1:8000';

export default function LandingPage({ onAnalysisComplete }: LandingPageProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState('READY');
    
    // Path State
    const [repoPath, setRepoPath] = useState<string>('');
    const [editRepoPath, setEditRepoPath] = useState<string>('');
    const [isEditingPath, setIsEditingPath] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [isLoadingPath, setIsLoadingPath] = useState(true);

    React.useEffect(() => {
        // Fetch current setting on mount
        const fetchPath = async () => {
            try {
                const res = await fetch(`${API_URL}/status`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.repo_path) {
                        setRepoPath(data.repo_path);
                        setEditRepoPath(data.repo_path);
                    }
                }
            } catch (e) {
                console.error("Failed adding path", e);
            } finally {
                setIsLoadingPath(false);
            }
        };
        fetchPath();
    }, []);

    const saveRepoPath = async () => {
        if (!editRepoPath.trim()) return;
        setSavingSettings(true);
        try {
            // We reuse the settings API to update path
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    safe_mode: true, // Default safe mode, we don't know checking it here might be tricky without fetching
                    repo_path: editRepoPath 
                })
            });
            
            if (res.ok) {
                setRepoPath(editRepoPath);
                setIsEditingPath(false);
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (e: any) {
            alert(`Failed to save path: ${e.message}`);
        } finally {
            setSavingSettings(false);
        }
    };

    const startAnalysis = async () => {
        setIsAnalyzing(true);
        setStatus('CONNECTING');
        setLogs(prev => [...prev, "Initializing connection to backend..."]);

        const ws = new WebSocket('ws://localhost:8000/ws/logs');
        
        ws.onopen = () => {
            setLogs(prev => [...prev, "Connection established.", "Starting codebase analysis..."]);
            setStatus('ANALYZING');
            
            setTimeout(() => {
                // Determine if analysis was already triggered by settings
                // We do this by hitting status first or just hitting analyze again (it's safe)
                // Actually, hitting analyze when one is running might be weird.
                // But generally users come here either fresh or from settings.
                // If we come from settings, the backend task is already running.
                // We should just listen.
                // Check if already running? Backend doesn't easily expose "is_running" yet 
                // but re-triggering it is okay, it will just re-queue or restart.
                // Or we can just let it run.
                // Let's just run it to be safe.
                fetch('http://localhost:8000/analyze', { method: 'POST' })
                    .then(res => {
                        if (!res.ok) throw new Error("Analysis failed");
                    })
                    .catch(err => {
                        setLogs(prev => [...prev, "Error: " + err.message]);
                        setIsAnalyzing(false);
                    });
            }, 500);
        };

        ws.onmessage = (event) => {
            const msg = event.data;
            if (msg === "ANALYSIS_COMPLETE") {
                setLogs(prev => [...prev, "Analysis complete! Loading visualization..."]);
                setTimeout(() => {
                    onAnalysisComplete();
                }, 1000);
                ws.close();
            } else {
                setLogs(prev => [...prev, msg]);
            }
        };

        ws.onclose = () => {
            if (status !== 'ANALYZING') {
                setLogs(prev => [...prev, "Connection closed."]);
            }
        };
    };

    const features = [
        {
            icon: Brain,
            title: "AI-Powered Analysis",
            description: "Leverages Gemini AI to understand and analyze complex code patterns"
        },
        {
            icon: Layers,
            title: "Deep Understanding",
            description: "Maps dependencies, identifies complexity hotspots, and finds technical debt"
        },
        {
            icon: Shield,
            title: "Safe Refactoring",
            description: "All changes are made on separate branches with full diff review"
        },
        {
            icon: GitBranch,
            title: "Version Control",
            description: "Seamless Git integration for reviewing and merging improvements"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
                
                {/* Subtle Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.4]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />

                {/* Floating Orbs */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

                <div className="relative max-w-6xl mx-auto px-6 py-20">
                    {/* Header */}
                    <nav className="flex items-center justify-between mb-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                <Pickaxe className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-semibold text-gray-900">Code Archeologist</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="badge badge-primary">
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Powered
                            </span>
                        </div>
                    </nav>

                    {!isAnalyzing ? (
                        <div className="animate-fade-in">
                            {/* Hero Content */}
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                                    Heal Your
                                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"> Legacy Code</span>
                                </h1>
                                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                    AI-powered codebase analysis and autonomous refactoring. 
                                    Understand complexity, identify technical debt, and modernize 
                                    your code with confidence.
                                </p>

                                {/* Codebase Selector */}
                                <div className="max-w-md mx-auto mb-8 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                            <Server className="w-4 h-4 text-gray-400 shrink-0" />
                                            {isEditingPath ? (
                                                <input 
                                                    type="text" 
                                                    value={editRepoPath} 
                                                    onChange={(e) => setEditRepoPath(e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm font-mono text-gray-800 focus:outline-none focus:border-indigo-500"
                                                    placeholder="/path/to/codebase"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex flex-col items-start min-w-0">
                                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Target Codebase</span>
                                                    <span className="text-sm font-mono text-gray-700 truncate w-full text-left" title={repoPath}>
                                                        {repoPath || "Loading settings..."}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {isEditingPath ? (
                                                <>
                                                    <button 
                                                        onClick={() => { setIsEditingPath(false); setEditRepoPath(repoPath); }}
                                                        className="p-1.5 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={saveRepoPath}
                                                        disabled={savingSettings}
                                                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
                                                        title="Save Path"
                                                    >
                                                        {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => setIsEditingPath(true)}
                                                    className="p-1.5 hover:bg-gray-200 text-gray-500 rounded-md transition-colors"
                                                    title="Change Target Codebase"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={startAnalysis}
                                    className="btn btn-primary text-lg px-8 py-4 group shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30"
                                >
                                    <Play className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    Start Analysis
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>

                            {/* Features Grid */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                                {features.map((feature, index) => (
                                    <div 
                                        key={index}
                                        className="card p-6 hover:border-indigo-200 transition-all animate-slide-up"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                                            <feature.icon className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Tech Stack */}
                            <div className="flex flex-wrap justify-center gap-4 opacity-60">
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                                    <Server className="w-4 h-4" />
                                    <span>Docker</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                                    <Database className="w-4 h-4" />
                                    <span>ChromaDB</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                                    <Zap className="w-4 h-4" />
                                    <span>Multi-Agent AI</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                                    <Code2 className="w-4 h-4" />
                                    <span>Tree-sitter</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Analysis Progress View */
                        <div className="max-w-2xl mx-auto animate-fade-in">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mb-6 shadow-lg shadow-indigo-500/25 animate-pulse-soft">
                                    <Pickaxe className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Codebase</h2>
                                <p className="text-gray-600">Please wait while we scan and map your project...</p>
                            </div>

                            {/* Progress Indicators */}
                            <div className="flex justify-center gap-8 mb-8">
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className={`w-4 h-4 ${status !== 'READY' ? 'text-green-500' : 'text-gray-300'}`} />
                                    <span className={status !== 'READY' ? 'text-gray-900' : 'text-gray-400'}>Connected</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className={`w-4 h-4 rounded-full border-2 ${status === 'ANALYZING' ? 'border-indigo-500 border-t-transparent animate-spin' : 'border-gray-300'}`} />
                                    <span className={status === 'ANALYZING' ? 'text-gray-900' : 'text-gray-400'}>Analyzing</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                    <span className="text-gray-400">Complete</span>
                                </div>
                            </div>

                            {/* Terminal Output */}
                            <TerminalOutput logs={logs} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
