'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Circle } from 'lucide-react';

interface TerminalProps {
    logs: string[];
}

export default function TerminalOutput({ logs }: TerminalProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="w-full bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden font-mono">
            {/* Window Header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <Circle className="w-3 h-3 fill-red-500 text-red-500" />
                        <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <TerminalIcon className="w-3 h-3" />
                    <span>code-archeologist</span>
                </div>
                <div className="w-12" /> {/* Spacer for symmetry */}
            </div>

            {/* Terminal Content */}
            <div className="p-4 h-80 overflow-y-auto custom-scrollbar bg-slate-950">
                {logs.length === 0 && (
                    <div className="text-slate-500 text-sm flex items-center gap-2">
                        <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse" />
                        Waiting for connection...
                    </div>
                )}
                
                {logs.map((log, i) => (
                    <div 
                        key={i} 
                        className="mb-2 text-sm flex items-start gap-3 animate-slide-up"
                        style={{ animationDelay: `${i * 0.05}s` }}
                    >
                        <span className="text-slate-600 text-xs mt-0.5 whitespace-nowrap">
                            {new Date().toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                        <span className="text-indigo-400">→</span>
                        <span className={`flex-1 ${
                            log.toLowerCase().includes('error') ? 'text-red-400' :
                            log.toLowerCase().includes('complete') || log.toLowerCase().includes('success') ? 'text-green-400' :
                            log.toLowerCase().includes('warning') ? 'text-yellow-400' :
                            'text-slate-300'
                        }`}>
                            {log}
                        </span>
                    </div>
                ))}
                
                {logs.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                        <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse" />
                    </div>
                )}
                
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
