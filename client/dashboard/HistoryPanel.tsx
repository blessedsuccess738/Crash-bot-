import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data generator
const generateHistory = () => {
  return Array.from({ length: 15 }, () => (Math.random() * 10 + 1).toFixed(2));
};

export default function HistoryPanel() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(generateHistory());
    
    // Simulate live updates
    const interval = setInterval(() => {
      setHistory(prev => [(Math.random() * 10 + 1).toFixed(2), ...prev.slice(0, 14)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">History</h3>
        <span className="text-xs text-emerald-500 animate-pulse">● Live</span>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        <AnimatePresence>
          {history.map((val, i) => {
            const num = parseFloat(val);
            const colorClass = num >= 2 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-gray-400 bg-gray-700/30 border-gray-600/30';
            
            return (
              <motion.div
                key={`${i}-${val}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-xs font-mono font-bold py-1.5 px-1 rounded text-center border ${colorClass}`}
              >
                {val}x
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
