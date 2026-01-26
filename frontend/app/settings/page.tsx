'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ConfirmModal from '../components/ConfirmModal';
import { 
    Settings, 
    Pickaxe, 
    Layers, 
    FileText, 
    ArrowLeft,
    Trash2,
    AlertTriangle,
    Database,
    Server,
    RefreshCw,
    CheckCircle2,
    GitBranch,
    Zap,
    ChevronRight,
    HardDrive,
    ToggleLeft,
    ToggleRight,
    Edit2,
    X,
    Save
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

export default function SettingsPage() {
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [vectorDbStatus, setVectorDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [aiStatus, setAiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    
    // Configuration State
    const [repoPath, setRepoPath] = useState<string>('');
    const [editRepoPath, setEditRepoPath] = useState<string>('');
    const [isEditingPath, setIsEditingPath] = useState(false);
    const [safeMode, setSafeMode] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    const [showResetModal, setShowResetModal] = useState(false);

    React.useEffect(() => {
        checkApiStatus();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`);
            if (res.ok) {
                const data = await res.json();
                setSafeMode(data.safe_mode);
                setRepoPath(data.repo_path);
                setEditRepoPath(data.repo_path);
            }
        } catch (e) {
            console.error("Failed to fetch settings", e);
        }
    };

    const updateSettings = async (updates: any) => {
        setSavingSettings(true);
        try {
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            if (res.ok) {
                const data = await res.json();
                setSafeMode(data.safe_mode);
                setRepoPath(data.repo_path);
                setEditRepoPath(data.repo_path);
                
                // Only redirect if the path ACTUALLY changed
                if (updates.repo_path && updates.repo_path !== repoPath) {
                    setIsEditingPath(false);
                    // Force re-analysis UI flow
                    localStorage.removeItem('archeologist_analysis_done');
                    window.location.href = '/';
                }
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (e: any) {
            alert(`Failed to save settings: ${e.message}`);
        } finally {
            setSavingSettings(false);
        }
    };

    const toggleSafeMode = () => {
        updateSettings({ safe_mode: !safeMode, repo_path: repoPath });
    };

    const saveRepoPath = () => {
        if (!editRepoPath.trim()) return;
        updateSettings({ safe_mode: safeMode, repo_path: editRepoPath });
    };

    const checkApiStatus = async () => {
        setApiStatus('checking');
        setVectorDbStatus('checking');
        setAiStatus('checking');
        try {
            const res = await fetch(`${API_URL}/status`);
            if (res.ok) {
                const data = await res.json();
                setApiStatus('online');
                setVectorDbStatus(data.vector_db_connected ? 'connected' : 'disconnected');
                setAiStatus(data.ai_connected ? 'connected' : 'disconnected');
                // Don't overwrite repoPath from status if we already fetched detailed settings
            } else {
                setApiStatus('offline');
                setVectorDbStatus('disconnected');
                setAiStatus('disconnected');
            }
        } catch {
            setApiStatus('offline');
            setVectorDbStatus('disconnected');
            setAiStatus('disconnected');
        }
    };

    const handleReset = async () => {
        setIsResetting(true);
        try {
            await fetch(`${API_URL}/reset`, { method: 'POST' });
            localStorage.removeItem('archeologist_analysis_done');
            setResetSuccess(true);
            setShowResetModal(false);
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } catch (e: any) {
            setShowResetModal(false);
            alert(`Reset failed: ${e.message}`);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                                <Pickaxe className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">Code Archeologist</h1>
                                <p className="text-xs text-gray-500">Settings</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1">
                        <Link href="/" className="btn-ghost text-sm rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                            <Layers className="w-4 h-4 mr-1.5 inline" />
                            Graph
                        </Link>
                        <Link href="/docs" className="btn-ghost text-sm rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                            <FileText className="w-4 h-4 mr-1.5 inline" />
                            Docs
                        </Link>
                        <span className="btn-ghost text-sm rounded-lg px-3 py-2 bg-indigo-50 text-indigo-700">
                            <Settings className="w-4 h-4 mr-1.5 inline" />
                            Settings
                        </span>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Graph
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                    <p className="text-gray-600">Configure your Code Archeologist instance</p>
                </div>

                <div className="space-y-6">
                    {/* System Status */}
                    <section className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Server className="w-5 h-5 text-indigo-600" />
                            System Status
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                        apiStatus === 'online' ? 'bg-green-500' :
                                        apiStatus === 'offline' ? 'bg-red-500' :
                                        'bg-yellow-500 animate-pulse'
                                    }`} />
                                    <div>
                                        <p className="font-medium text-gray-900">Backend API</p>
                                        <p className="text-sm text-gray-500">localhost:8000</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={checkApiStatus}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Check status"
                                >
                                    <RefreshCw className={`w-4 h-4 text-gray-500 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Database className="w-5 h-5 text-violet-500" />
                                    <div>
                                        <p className="font-medium text-gray-900">Vector Database</p>
                                        <p className="text-sm text-gray-500">ChromaDB</p>
                                    </div>
                                </div>
                                <span className={`badge ${vectorDbStatus === 'connected' ? 'badge-success' : vectorDbStatus === 'disconnected' ? 'badge-error' : 'badge-warning'}`}>
                                    {vectorDbStatus === 'connected' ? 'Active' : vectorDbStatus === 'disconnected' ? 'Offline' : 'Checking...'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    <div>
                                        <p className="font-medium text-gray-900">AI Model</p>
                                        <p className="text-sm text-gray-500">Gemini</p>
                                    </div>
                                </div>
                                <span className={`badge ${aiStatus === 'connected' ? 'badge-primary' : aiStatus === 'disconnected' ? 'badge-error' : 'badge-warning'}`}>
                                    {aiStatus === 'connected' ? 'Connected' : aiStatus === 'disconnected' ? 'Offline' : 'Checking...'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <GitBranch className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="font-medium text-gray-900">Git Integration</p>
                                        <p className="text-sm text-gray-500">Auto-branching enabled</p>
                                    </div>
                                </div>
                                <span className="badge badge-success">Ready</span>
                            </div>
                        </div>
                    </section>

                    {/* Configuration */}
                    <section className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-indigo-600" />
                            Configuration
                        </h2>
                        
                        <div className="space-y-4">
                            {/* Target Codebase */}
                            <div className="p-4 border border-gray-200 rounded-lg transition-all hover:border-indigo-200">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-medium text-gray-900">Target Codebase</p>
                                        <p className="text-sm text-gray-500">Local path to the repository to be analyzed.</p>
                                    </div>
                                    {!isEditingPath ? (
                                        <button 
                                            onClick={() => setIsEditingPath(true)}
                                            className="btn btn-ghost p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-full"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => { setIsEditingPath(false); setEditRepoPath(repoPath); }}
                                            className="btn btn-ghost p-2 hover:bg-red-50 hover:text-red-600 rounded-full"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                {isEditingPath ? (
                                    <div className="flex gap-2 mt-2 animate-fade-in">
                                        <input 
                                            type="text" 
                                            value={editRepoPath} 
                                            onChange={(e) => setEditRepoPath(e.target.value)}
                                            className="input flex-1 font-mono text-sm"
                                            placeholder="/path/to/your/project"
                                        />
                                        <button 
                                            onClick={saveRepoPath}
                                            disabled={savingSettings}
                                            className="btn btn-primary"
                                        >
                                            {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 rounded px-3 py-2 font-mono text-sm text-gray-700 truncate">
                                        {repoPath || "Not configured"}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Analysis Depth</p>
                                    <p className="text-sm text-gray-500">Full recursive scan</p>
                                </div>
                                <span className="text-sm text-indigo-600 font-medium">Deep</span>
                            </div>

                            {/* Safe Mode Toggle */}
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Safe Mode (Auto-Branching)</p>
                                    <p className="text-sm text-gray-500">
                                        {safeMode 
                                            ? "AI changes create a new branch for review." 
                                            : "AI changes are applied DIRECTLY to the current branch."}
                                    </p>
                                </div>
                                <button 
                                    onClick={toggleSafeMode}
                                    disabled={savingSettings}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                        safeMode ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`${
                                            safeMode ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm`}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="card p-6 border-red-200 bg-red-50/30">
                        <h2 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            Danger Zone
                        </h2>
                        <p className="text-sm text-red-700 mb-4">
                            These actions are destructive and cannot be undone.
                        </p>

                        <div className="p-4 bg-white rounded-lg border border-red-200">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-medium text-gray-900">Reset Analysis Data</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        This will clear the vector database and reset all analysis state. 
                                        Your merged code changes on disk will remain safe.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowResetModal(true)}
                                    disabled={isResetting || resetSuccess}
                                    className={`btn shrink-0 ${
                                        resetSuccess 
                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                >
                                    {isResetting ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Resetting...</>
                                    ) : resetSuccess ? (
                                        <><CheckCircle2 className="w-4 h-4" /> Reset Complete</>
                                    ) : (
                                        <><Trash2 className="w-4 h-4" /> Reset System</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Reset Confirmation Modal */}
            <ConfirmModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleReset}
                title="Reset Analysis Data"
                message="This will clear the vector database and reset all analysis state. Your merged code changes on disk will remain safe. This action cannot be undone."
                confirmText="Reset System"
                variant="danger"
                icon="trash"
                isLoading={isResetting}
                loadingText="Resetting..."
            />
        </div>
    );
}
