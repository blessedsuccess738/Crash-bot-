import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EngineMonitor from './EngineMonitor';
import DebugConsole from './DebugConsole';
import FeedInspector from './FeedInspector';
import NetworkInspector from './NetworkInspector';

interface DevModeToggleProps {
  initialOpen?: boolean;
}

export default function DevModeToggle({ initialOpen = false }: DevModeToggleProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'engine' | 'feed' | 'network'>('network');

  useEffect(() => {
    // Override console.log to capture logs
    const originalLog = console.log;
    console.log = (...args) => {
      setLogs(prev => [`[LOG] ${args.join(' ')}`, ...prev].slice(0, 50));
      originalLog(...args);
    };
    return () => {
      console.log = originalLog;
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-black/95 border border-emerald-500/30 rounded-lg p-4 w-80 h-96 overflow-hidden flex flex-col mb-4 shadow-2xl backdrop-blur-md"
          >
            <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
              <h3 className="text-emerald-400 font-mono text-sm font-bold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                DEV TOOLS
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => setActiveTab('network')} 
                  className={`text-[10px] px-2 py-1 rounded ${activeTab === 'network' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Network
                </button>
                <button 
                  onClick={() => setActiveTab('console')} 
                  className={`text-[10px] px-2 py-1 rounded ${activeTab === 'console' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Console
                </button>
                <button 
                  onClick={() => setActiveTab('engine')} 
                  className={`text-[10px] px-2 py-1 rounded ${activeTab === 'engine' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Engine
                </button>
                <button 
                  onClick={() => setActiveTab('feed')} 
                  className={`text-[10px] px-2 py-1 rounded ${activeTab === 'feed' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Feed
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden font-mono text-xs">
              {activeTab === 'network' && <NetworkInspector />}
              {activeTab === 'console' && <DebugConsole logs={logs} onClear={() => setLogs([])} />}
              {activeTab === 'engine' && <EngineMonitor />}
              {activeTab === 'feed' && <FeedInspector />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isOpen ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>
    </div>
  );
}
