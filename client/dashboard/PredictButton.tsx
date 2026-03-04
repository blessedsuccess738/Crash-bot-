import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getPrediction } from '../services/predictorService';

// Event bus for communication between components (simple implementation)
export const predictionEventBus = new EventTarget();

export default function PredictButton() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePredict = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    // Dispatch analyzing event
    predictionEventBus.dispatchEvent(new CustomEvent('prediction-start'));

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate prediction using the engine
    // Pass mock history for now
    const mockHistory = Array.from({ length: 10 }, () => (Math.random() * 10).toFixed(2));
    const prediction = await getPrediction(mockHistory);
    
    // Dispatch result
    predictionEventBus.dispatchEvent(new CustomEvent('prediction-result', { detail: prediction }));
    
    setIsAnalyzing(false);
  };

  return (
    <button
      onClick={handlePredict}
      disabled={isAnalyzing}
      className={`
        w-full relative overflow-hidden group
        bg-gradient-to-r from-emerald-600 to-emerald-500 
        hover:from-emerald-500 hover:to-emerald-400
        text-white font-black text-xl tracking-widest uppercase py-6 rounded-2xl
        shadow-[0_0_20px_rgba(16,185,129,0.3)]
        transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-70 disabled:cursor-not-allowed
      `}
    >
      <span className="relative z-10 flex items-center justify-center gap-3">
        {isAnalyzing ? (
          <>
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            GET SIGNAL
          </>
        )}
      </span>
      
      {/* Shine effect */}
      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
    </button>
  );
}
