import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DevModeToggleProps {
  initialOpen?: boolean;
}

export default function DevModeToggle({ initialOpen = false }: DevModeToggleProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [logs, setLogs] = useState<string[]>([]);

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
            className="bg-black/90 border border-emerald-500/30 rounded-lg p-4 w-80 h-64 overflow-hidden flex flex-col mb-4 shadow-2xl backdrop-blur-sm"
          >
            <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
              <h3 className="text-emerald-400 font-mono text-sm font-bold">DEV TOOLS</h3>
              <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-white">Clear</button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-xs text-green-300 space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="break-words opacity-80 hover:opacity-100">{log}</div>
              ))}
              {logs.length === 0 && <div className="text-gray-600 italic">No logs captured...</div>}
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
