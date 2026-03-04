import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LiveMultiplierFeed() {
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [crashed, setCrashed] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'UPDATE') {
          setCrashed(false);
          setCurrentMultiplier(data.value);
          // Dispatch event for devtools feed inspector
          window.dispatchEvent(new CustomEvent('crash-feed-update', { detail: data }));
        } else if (data.type === 'CRASH') {
          setCrashed(true);
          setCurrentMultiplier(data.value);
          // Dispatch event for devtools feed inspector
          window.dispatchEvent(new CustomEvent('crash-feed-update', { detail: data }));
        }
      } catch (e) {
        console.error('Error parsing SSE data', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        // Re-mount logic or just let the user refresh for now
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg relative overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Live Feed</h3>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${crashed ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
          <span className="text-xs text-gray-400">{crashed ? 'CRASHED' : 'RUNNING'}</span>
        </div>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className={`text-4xl font-mono font-black transition-colors duration-100 ${crashed ? 'text-red-500' : 'text-white'}`}>
          {currentMultiplier.toFixed(2)}x
        </div>
      </div>
      
      {/* Background Graph Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
        <motion.div 
          className={`h-full ${crashed ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min((currentMultiplier / 10) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
