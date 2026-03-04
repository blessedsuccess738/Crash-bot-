import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictionEventBus } from './PredictButton';

export default function CircleMultiplier() {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'result'>('idle');

  useEffect(() => {
    const handleStart = () => {
      setStatus('analyzing');
      setPrediction(null);
    };

    const handleResult = (e: Event) => {
      const customEvent = e as CustomEvent;
      setPrediction(customEvent.detail);
      setStatus('result');
    };

    predictionEventBus.addEventListener('prediction-start', handleStart);
    predictionEventBus.addEventListener('prediction-result', handleResult);

    return () => {
      predictionEventBus.removeEventListener('prediction-start', handleStart);
      predictionEventBus.removeEventListener('prediction-result', handleResult);
    };
  }, []);

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Rings */}
      <div className="absolute inset-0 border-4 border-gray-700/30 rounded-full" />
      <div className="absolute inset-4 border-2 border-gray-700/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
      
      {/* Analyzing Animation */}
      {status === 'analyzing' && (
        <motion.div 
          className="absolute inset-0 border-4 border-t-emerald-500 border-r-transparent border-b-emerald-500 border-l-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Content */}
      <div className="text-center z-10">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-500 font-mono text-sm"
            >
              WAITING FOR SIGNAL
            </motion.div>
          )}

          {status === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-emerald-400 font-mono text-lg animate-pulse"
            >
              CALCULATING...
            </motion.div>
          )}

          {status === 'result' && prediction && (
            <motion.div
              key="result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <span className="text-gray-400 text-xs uppercase tracking-widest mb-1">Prediction</span>
              <span className="text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                {prediction}x
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
