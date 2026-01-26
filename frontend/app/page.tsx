'use client';

/**
 * Code Archeologist - Main Dashboard
 * Modern 3D code visualization with AI-powered refactoring
 */

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import LandingPage from './components/LandingPage';
import ConfirmModal from './components/ConfirmModal';
import Link from 'next/link';
import { 
  Activity, 
  Cpu, 
  Search, 
  Code as CodeIcon, 
  CheckCircle2, 
  RefreshCw,
  GitGraph,
  X,
  BookOpen,
  GitMerge,
  Trash2,
  FileDiff,
  Wrench,
  Settings,
  AlertTriangle,
  ChevronRight,
  Layers,
  FileCode,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
  Pickaxe,
  FileText,
  HelpCircle
} from 'lucide-react';

// ForceGraph must be client-side only
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading visualization...</p>
      </div>
    </div>
  )
});

const API_URL = 'http://127.0.0.1:8000';

type Node = {
  id: string;
  file: string;
  type: string;
  code?: string;
  complexity?: number;
  x?: number;
  y?: number;
  z?: number;
  __threeObj?: any;
};

type HealResult = {
  status: string;
  old_node: string;
  new_name: string;
  ai_report: string;
  propagated_to: string[];
  branch?: string;
  message?: string;
};

type LogEntry = {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

export default function Home() {
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  
  // Interaction State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sidebarMode, setSidebarMode] = useState<'inspect' | 'logs'>('inspect');
  const [healResult, setHealResult] = useState<HealResult | null>(null);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    icon: 'trash' | 'merge' | 'warning';
    onConfirm: () => void;
  } | null>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 0, height: 0 }); 
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  // Smoothly update graph dimensions during panel animation
  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        setGraphDimensions({
          width: graphContainerRef.current.clientWidth,
          height: graphContainerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (graphContainerRef.current) {
      observer.observe(graphContainerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    }
  }, [hasStarted]);

  // Animate graph resize when panel opens/closes
  useEffect(() => {
    let animationFrame: number;
    let startTime: number;
    const duration = 500; // Match the CSS transition duration

    const animateResize = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (graphContainerRef.current) {
        setGraphDimensions({
          width: graphContainerRef.current.clientWidth,
          height: graphContainerRef.current.clientHeight
        });
      }

      if (elapsed < duration) {
        animationFrame = requestAnimationFrame(animateResize);
      }
    };

    animationFrame = requestAnimationFrame(animateResize);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPanelOpen]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [{
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }, ...prev].slice(0, 50));
  };

  const fetchGraph = async () => {
    setLoading(true);
    addLog("Fetching graph data...", "info");
    
    try {
      const res = await fetch(`${API_URL}/graph?refresh=${Date.now()}`, { 
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      
      const nodes = Array.isArray(data.nodes) ? data.nodes : [];
      const edges = data.links || data.edges || [];

      if (nodes.length === 0) {
        addLog("No nodes found in graph.", "warning");
      }

      const processedNodes = nodes.map((n: any) => {
        const c = n.complexity || 1;
        
        // Modern color palette based on complexity
        let color = '#10b981'; // Green (Low)
        if (c > 35) color = '#8b5cf6';      // Violet (Extreme)
        else if (c > 20) color = '#ef4444'; // Red (High)
        else if (c > 10) color = '#f97316'; // Orange (Medium)
        else if (c > 5) color = '#eab308';  // Yellow (Low-Med)
        else if (c > 2) color = '#22c55e';  // Green-500 (Low)
        
        return {
          ...n,
          color: color,
          _uiColor: color,
          val: Math.pow(c, 0.5) * 2 
        };
      });
      
      setGraphData({ nodes: processedNodes, links: edges });
      addLog(`Loaded ${processedNodes.length} nodes and ${edges.length} links.`, "success");
      
      if (nodes.length > 0 && fgRef.current) {
        setTimeout(() => {
          fgRef.current.zoomToFit(1000, 50);
        }, 500);
      }
      
      return nodes;
    } catch (e: any) {
      console.error(e);
      addLog(`Connection error: ${e.message}`, "error");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    setLoading(true);
    addLog("Running deep analysis...", "warning");
    try {
      await fetch(`${API_URL}/analyze`, { method: 'POST' });
      addLog("Analysis complete.", "success");
      fetchGraph();
    } catch(e: any) {
      addLog(`Analysis failed: ${e.message}`, "error");
      setLoading(false);
    }
  }

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    setSidebarMode('inspect');
    setHealResult(null); 
    setExplanation(null);
    setIsPanelOpen(true);
    
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, 
        node, 
        2000
      );
    }
    
    addLog(`Selected: ${node.id}`, "info");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    addLog(`Searching for: "${searchQuery}"`, "info");
    try {
      const res = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const matchedIds = data.results.map((r: any) => r.node_id);
        setSearchResults(matchedIds);
        addLog(`Found ${matchedIds.length} results.`, "success");
        
        const firstNode = graphData.nodes.find(n => n.id === matchedIds[0]);
        if (firstNode && fgRef.current) {
          fgRef.current.cameraPosition(
            { x: firstNode.x + 40, y: firstNode.y + 40, z: firstNode.z + 40 },
            firstNode,
            1500
          );
          setSelectedNode(firstNode);
          setIsPanelOpen(true);
          setSidebarMode('inspect');
        }
      } else {
        setSearchResults([]);
        addLog("No results found.", "warning");
      }
    } catch (e: any) {
      addLog(`Search failed: ${e.message}`, "error");
    }
  };

  const handleHeal = async () => {
    if (!selectedNode) return;
    setIsHealing(true);
    addLog(`Starting refactoring for ${selectedNode.id}...`, "warning");
    
    try {
      const res = await fetch(`${API_URL}/heal`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ node_id: selectedNode.id })
      });
      const result: HealResult = await res.json();
      
      if (result.status === 'success') {
        setHealResult(result);
        addLog(`Refactoring complete: ${result.new_name}`, "success");
        if (result.propagated_to.length > 0) {
          addLog(`Updated ${result.propagated_to.length} dependent files.`, "info");
        }
      } else {
        addLog(`Refactoring failed: ${result.message}`, "error");
      }
    } catch (e: any) {
      addLog(`Error: ${e.message}`, "error");
    } finally {
      setIsHealing(false);
    }
  };

  const handleReviewDiff = async (branch: string) => {
    addLog(`Loading diff for ${branch}...`, "info");
    try {
      const res = await fetch(`${API_URL}/git/diff`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ branch_name: branch })
      });
      const data = await res.json();
      setDiffContent(data.diff);
      setShowDiffModal(true);
    } catch(e: any){
      addLog(`Failed to load diff: ${e.message}`, 'error');
    }
  };

  const handleMerge = async (branch: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Merge Changes',
      message: 'Are you sure you want to merge these changes into main? This will apply all refactoring changes to your codebase.',
      confirmText: 'Merge to Main',
      variant: 'info',
      icon: 'merge',
      onConfirm: async () => {
        setIsMerging(true);
        addLog(`Merging ${branch}...`, "warning");
        try {
          const res = await fetch(`${API_URL}/git/merge`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ branch_name: branch })
          });
          const data = await res.json();
          if (data.status === 'success') {
            addLog("Merge successful!", "success");

            // Save context before clearing state
            const targetNewName = healResult?.new_name;
            const contextFile = selectedNode?.file;
            const contextId = selectedNode?.id;

            setHealResult(null);
            setShowDiffModal(false);
            const updatedNodes = await fetchGraph();
            
            if (contextId) {
              let nextNode = null;
              
              // 1. Try to find the node by its NEW name (if renamed)
              if (targetNewName && contextFile) {
                 const suffix = `::${targetNewName}`;
                 nextNode = updatedNodes.find((n: any) => 
                   n.file === contextFile && (n.id.endsWith(suffix) || n.id === targetNewName)
                 );
              }
              
              // 2. Fallback: Try to find by OLD ID (if same name)
              if (!nextNode) {
                nextNode = updatedNodes.find((n: any) => n.id === contextId);
              }

              if (nextNode) {
                setSelectedNode(nextNode);
                addLog(`Switched view to ${nextNode.id}`, "info");
              }
            }
          } else {
            addLog(`Merge failed: ${data.message}`, "error");
          }
        } catch(e: any){
          addLog(`Merge failed: ${e.message}`, "error");
        } finally {
          setIsMerging(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleDiscard = async (branch: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Discard Changes',
      message: 'Are you sure you want to discard these AI-generated changes? This action cannot be undone.',
      confirmText: 'Discard Changes',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        setIsDiscarding(true);
        addLog(`Discarding ${branch}...`, "warning");
        try {
          const res = await fetch(`${API_URL}/git/discard`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ branch_name: branch })
          });
          const data = await res.json();
          if (data.status === 'success') {
            addLog("Changes discarded.", "info");
            setHealResult(null);
            setShowDiffModal(false);
          }
        } catch(e: any){
          addLog(`Discard failed: ${e.message}`, "error");
        } finally {
          setIsDiscarding(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleExplain = async () => {
    if (!selectedNode) return;
    setIsExplaining(true);
    addLog(`Analyzing ${selectedNode.id}...`, "info");

    try {
      const res = await fetch(`${API_URL}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: selectedNode.id })
      });
      const result = await res.json();
      if (result.explanation) {
        setExplanation(result.explanation);
        addLog(`Analysis complete for ${selectedNode.id}.`, "success");
      } else {
        addLog(`Analysis failed: ${result.detail || "Unknown error"}`, "error");
      }
    } catch(e: any) {
      addLog(`Error: ${e.message}`, "error");
    } finally {
      setIsExplaining(false);
    }
  };

  useEffect(() => {
    const initSystem = async () => {
      try {
        const res = await fetch(`${API_URL}/status`);
        const data = await res.json();
        
        if (data.analyzed) {
          setHasStarted(true);
          localStorage.setItem('archeologist_analysis_done', 'true');
        } else {
          setHasStarted(false);
        }
      } catch (e) {
        setHasStarted(false);
      }
    };
    
    initSystem();
  }, []);

  useEffect(() => {
    if (hasStarted) {
      fetchGraph();
    }
  }, [hasStarted]);

  const handleReset = async () => {
    if (!confirm("This will reset all analysis data. Code changes already merged will remain. Continue?")) return;
    
    try {
      addLog("Resetting system...", "warning");
      await fetch(`${API_URL}/reset`, { method: 'POST' });
      
      localStorage.removeItem('archeologist_analysis_done');
      setHasStarted(false);
      setIsSettingsOpen(false);
      
    } catch (e: any) {
      addLog(`Reset failed: ${e.message}`, "error");
    }
  };

  // Complexity badge color helper
  const getComplexityColor = (complexity: number) => {
    if (complexity > 20) return 'bg-red-100 text-red-700 border-red-200';
    if (complexity > 10) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (complexity > 5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  // Loading state
  if (hasStarted === null) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Connecting to server...</p>
        </div>
      </div>
    );
  }

  // Landing page
  if (!hasStarted) {
    return <LandingPage onAnalysisComplete={() => {
      localStorage.setItem('archeologist_analysis_done', 'true');
      setHasStarted(true);
    }} />;
  }

  return (
    <div className="h-screen w-full bg-slate-100 flex flex-col overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
              <Pickaxe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Code Archeologist</h1>
              <p className="text-xs text-gray-500">Legacy Code Healing</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            <span className="btn-ghost text-sm rounded-lg px-3 py-2 bg-indigo-50 text-indigo-700">
              <Layers className="w-4 h-4 mr-1.5 inline" />
              Graph
            </span>
            <Link href="/docs" className="btn-ghost text-sm rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              <FileText className="w-4 h-4 mr-1.5 inline" />
              Docs
            </Link>
            <Link href="/settings" className="btn-ghost text-sm rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              <Settings className="w-4 h-4 mr-1.5 inline" />
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code..."
              className="input !pl-10 !pr-8 py-2 w-64 text-sm"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Action Buttons */}
          <button 
            onClick={fetchGraph} 
            className="btn btn-secondary text-sm"
            title="Refresh graph"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button 
            onClick={triggerAnalysis} 
            className="btn btn-primary text-sm"
            disabled={loading}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Re-analyze</span>
          </button>

          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="btn btn-ghost p-2"
            title={isPanelOpen ? "Hide panel" : "Show panel"}
          >
            {isPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Graph Container */}
        <div 
          ref={graphContainerRef}
          className={`flex-1 relative transition-all duration-500 ease-in-out bg-gradient-to-br from-slate-50 to-slate-100 min-w-0`}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading graph...</p>
                <p className="text-sm text-gray-400">Analyzing code structure</p>
              </div>
            </div>
          ) : (
            <ForceGraph3D
              width={graphDimensions.width}
              height={graphDimensions.height}
              ref={fgRef}
              graphData={graphData}
              nodeLabel="id"
              nodeColor={(node: any) => {
                if (node.id === selectedNode?.id) return '#6366f1';
                const complexityColor = node._uiColor || node.color || '#10b981';
                const isSearchActive = searchResults.length > 0;
                const isMatch = searchResults.includes(node.id);
                
                if (isSearchActive) {
                  if (isMatch) return complexityColor;
                  return '#cbd5e1';
                }
                
                return complexityColor;
              }}
              nodeOpacity={1.0} 
              nodeVal="val"
              linkColor={() => '#94a3b8'}
              linkOpacity={0.4}
              linkWidth={0.8}
              onNodeClick={handleNodeClick}
              backgroundColor="#f8fafc"
            />
          )}

          {/* Complexity Legend */}
          <div className="absolute bottom-6 left-6 card p-4 z-10">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Complexity</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-gray-600">Extreme (&gt;35)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-600">High (&gt;20)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-600">Medium (&gt;10)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600">Low (&gt;5)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Simple (≤5)</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="absolute bottom-6 right-6 card px-4 py-2 z-10 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <GitGraph className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">{graphData.nodes.length}</span> nodes
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-600">
              <Activity className="w-4 h-4 text-violet-500" />
              <span className="font-medium">{graphData.links.length}</span> links
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div 
          className={`w-[420px] shrink-0 bg-white border-l border-gray-200 flex flex-col transition-all duration-500 ease-in-out ${
            isPanelOpen ? 'mr-0' : '-mr-[420px]'
          }`}
        >
          {/* Panel Tabs */}
          <div className="flex border-b border-gray-200 shrink-0">
            <button 
              onClick={() => setSidebarMode('inspect')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                sidebarMode === 'inspect' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CodeIcon className="w-4 h-4" /> Inspector
            </button>
            <button 
              onClick={() => setSidebarMode('logs')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                sidebarMode === 'logs' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Activity className="w-4 h-4" /> Activity
              {logs.length > 0 && (
                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{logs.length}</span>
              )}
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sidebarMode === 'inspect' ? (
              selectedNode ? (
                <div className="flex flex-col h-full">
                  {/* Node Header */}
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selected Element</p>
                        <h2 className="text-lg font-semibold text-gray-900 truncate">{selectedNode.id.split('::')[1] || selectedNode.id}</h2>
                      </div>
                      <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <FileCode className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{selectedNode.file}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="badge badge-primary">{selectedNode.type}</span>
                      <span className={`badge border ${getComplexityColor(selectedNode.complexity || 1)}`}>
                        Complexity: {selectedNode.complexity || 1}
                      </span>
                    </div>
                  </div>

                  {/* Healing Result or Code Preview */}
                  {isHealing ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">AI is Refactoring</h3>
                      <p className="text-gray-500 text-sm">Analyzing and improving code structure...</p>
                    </div>
                  ) : healResult && (selectedNode.id === healResult.old_node || selectedNode.id === healResult.new_name) ? (
                    <div className="flex-1 flex flex-col animate-fade-in">
                      <div className="p-4 bg-green-50 border-b border-green-100 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <h3 className="font-medium text-green-900">Refactoring Complete</h3>
                          <p className="text-sm text-green-700">Changes ready for review</p>
                        </div>
                      </div>

                      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        <div className="prose-modern text-sm bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <ReactMarkdown>{healResult.ai_report}</ReactMarkdown>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-xs text-red-600 uppercase tracking-wider mb-1">Original</p>
                            <p className="font-mono text-sm text-red-700 truncate">{healResult.old_node.split('::')[1] || healResult.old_node}</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-xs text-green-600 uppercase tracking-wider mb-1">Refactored</p>
                            <p className="font-mono text-sm text-green-700 truncate">{healResult.new_name}</p>
                          </div>
                        </div>

                        {healResult.branch && (
                          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                            <div className="flex items-center gap-2 mb-3">
                              <GitGraph className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm font-medium text-indigo-900">Branch: {healResult.branch}</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleReviewDiff(healResult.branch!)}
                                className="btn btn-secondary flex-1 text-sm"
                              >
                                <FileDiff className="w-4 h-4" /> Review
                              </button>
                              <button 
                                onClick={() => handleDiscard(healResult.branch!)}
                                className="btn text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Normal Code Preview */
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Source Code</span>
                        <button 
                          onClick={handleExplain}
                          disabled={isExplaining}
                          className="btn btn-ghost text-xs py-1 px-2"
                        >
                          {isExplaining ? (
                            <><Activity className="w-3 h-3 animate-spin" /> Analyzing...</>
                          ) : (
                            <><BookOpen className="w-3 h-3" /> Explain</>
                          )}
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50">
                        <SyntaxHighlighter 
                          language={selectedNode.file.endsWith('.py') ? 'python' : 'typescript'} 
                          style={oneLight}
                          customStyle={{margin: 0, padding: '1rem', background: 'transparent', fontSize: '12px', lineHeight: '1.6'}}
                          showLineNumbers={true}
                          wrapLongLines={true}
                        >
                          {selectedNode.code || "// Source code not loaded."}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {!isHealing && (!healResult || (selectedNode.id !== healResult.old_node && selectedNode.id !== healResult.new_name)) && (
                    <div className="p-4 border-t border-gray-200 bg-white shrink-0">
                      {explanation && (
                        <div className="mb-4 p-4 bg-violet-50 rounded-lg border border-violet-100 relative animate-fade-in">
                          <button 
                            onClick={() => setExplanation(null)}
                            className="absolute top-2 right-2 p-1 hover:bg-violet-200 rounded"
                          >
                            <X className="w-3 h-3 text-violet-500" />
                          </button>
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-violet-600" />
                            <h4 className="font-medium text-violet-900 text-sm">AI Explanation</h4>
                          </div>
                          <div className="prose-modern text-sm max-h-40 overflow-y-auto custom-scrollbar">
                            <ReactMarkdown>{explanation}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleHeal}
                        className="w-full btn btn-primary py-3"
                      >
                        <Wrench className="w-4 h-4" />
                        Refactor with AI
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <Layers className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Element Selected</h3>
                  <p className="text-sm text-gray-500 max-w-[200px]">
                    Click on a node in the graph to inspect its code and run AI analysis.
                  </p>
                </div>
              )
            ) : (
              /* Logs Panel */
              <div className="p-4">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div 
                        key={log.id} 
                        className={`p-3 rounded-lg text-sm flex items-start gap-3 animate-slide-up ${
                          log.type === 'error' ? 'bg-red-50 text-red-700' :
                          log.type === 'success' ? 'bg-green-50 text-green-700' :
                          log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-blue-50 text-blue-700'
                        }`}
                      >
                        <span className="text-xs opacity-60 whitespace-nowrap mt-0.5">{log.timestamp}</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>{/* End Side Panel */}
      </div>{/* End Main Content */}

      {/* Diff Modal */}
      {showDiffModal && healResult && healResult.branch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            
            {isMerging && (
              <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Merging Changes</h3>
                <p className="text-gray-500 text-sm">Updating codebase...</p>
              </div>
            )}

            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileDiff className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="font-semibold text-gray-900">Review Changes</h2>
                  <p className="text-xs text-gray-500">Comparing main → {healResult.branch}</p>
                </div>
              </div>
              <button onClick={() => setShowDiffModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Diff Content */}
            <div className="flex-1 overflow-auto bg-gray-50 p-4 font-mono text-sm">
              {diffContent ? (
                <SyntaxHighlighter language="diff" style={oneLight} showLineNumbers={true} customStyle={{background: 'transparent', margin: 0}}>
                  {diffContent}
                </SyntaxHighlighter>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400">
                  <Activity className="w-5 h-5 animate-spin mr-2" /> Loading diff...
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => handleDiscard(healResult.branch!)}
                disabled={isDiscarding}
                className="btn text-sm bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Discard
              </button>
              <button 
                onClick={() => handleMerge(healResult.branch!)}
                disabled={isMerging}
                className="btn btn-primary text-sm disabled:opacity-50"
              >
                <GitMerge className="w-4 h-4" /> Merge to Main
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal?.isOpen || false}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm()}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        icon={confirmModal?.icon}
        isLoading={isMerging || isDiscarding}
        loadingText={isMerging ? 'Merging...' : 'Discarding...'}
      />
    </div>
  );
}
