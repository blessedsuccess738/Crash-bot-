import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LiveMultiplierFeed() {
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [crashed, setCrashed] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let value = 1.00;
    let isRunning = true;

    const runGame = () => {
      value = 1.00;
      setCrashed(false);
      isRunning = true;
      
      const crashPoint = Math.random() * 10 + 1; // Random crash point

      interval = setInterval(() => {
        if (!isRunning) return;

        value += value * 0.05; // Exponential growth
        
        if (value >= crashPoint) {
          setCrashed(true);
          isRunning = false;
          clearInterval(interval);
          setTimeout(runGame, 3000); // Restart after 3s
        } else {
          setCurrentMultiplier(value);
        }
      }, 100);
    };

    runGame();
    return () => clearInterval(interval);
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
