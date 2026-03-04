import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPanel() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    // Fetch initial history from database
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/crashes');
        const data = await res.json();
        if (Array.isArray(data)) {
          setHistory(data.map((item: any) => item.multiplier.toFixed(2)));
        }
      } catch (e) {
        console.error('Failed to fetch crash history', e);
      }
    };

    fetchHistory();

    // Listen to real-time crash updates
    const handleFeedUpdate = (e: any) => {
      const data = e.detail;
      if (data.type === 'CRASH') {
        setHistory(prev => {
          const newHistory = [data.value.toFixed(2), ...prev];
          return newHistory.slice(0, 15); // Keep only the last 15 items
        });
      }
    };

    window.addEventListener('crash-feed-update', handleFeedUpdate);
    return () => window.removeEventListener('crash-feed-update', handleFeedUpdate);
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
