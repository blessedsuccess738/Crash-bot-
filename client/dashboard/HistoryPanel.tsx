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
          setHistory(data.slice(0, 1).map((item: any) => item.multiplier.toFixed(2)));
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
          return newHistory.slice(0, 1); // Keep only the last 1 item
        });
      }
    };

    window.addEventListener('crash-feed-update', handleFeedUpdate);
    return () => window.removeEventListener('crash-feed-update', handleFeedUpdate);
  }, []);

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Last Crash</h3>
        <span className="text-xs text-emerald-500 animate-pulse">● Live</span>
      </div>
      
      <div className="flex justify-center">
        <AnimatePresence>
          {history.map((val, i) => {
            const num = parseFloat(val);
            const colorClass = num >= 2 ? 'text-emerald-400' : 'text-gray-400';
            
            return (
              <motion.div
                key={`${i}-${val}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-4xl font-mono font-black py-4 px-6 rounded-xl text-center border border-gray-700 bg-gray-900/50 ${colorClass}`}
              >
                {val}x
              </motion.div>
            );
          })}
        </AnimatePresence>
        {history.length === 0 && (
          <div className="text-gray-500 text-sm py-4">Waiting for crash...</div>
        )}
      </div>
    </div>
  );
}
