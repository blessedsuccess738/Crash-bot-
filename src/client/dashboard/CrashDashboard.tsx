import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/sessionManager';
import { motion } from 'framer-motion';
import CircleMultiplier from './CircleMultiplier';
import HistoryPanel from './HistoryPanel';
import PredictButton from './PredictButton';
import LiveMultiplierFeed from './LiveMultiplierFeed';
import { useNavigate } from 'react-router-dom';

export default function CrashDashboard() {
  const { user, logout, validateAccessKey } = useAuth();
  const navigate = useNavigate();
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAccessKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAccessError('');
    
    try {
      const isValid = await validateAccessKey(accessKeyInput);
      if (!isValid) {
        setAccessError('Invalid access key. Contact admin.');
      }
    } catch (err) {
      setAccessError('Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!user?.hasAccessKey) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-700"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-gray-400">Enter your access key to activate the prediction engine.</p>
            <p className="text-sm text-gray-500 mt-2">Contact: blessedsuccess738@gmail.com</p>
          </div>

          <form onSubmit={handleAccessKeySubmit} className="space-y-4">
            <input
              type="text"
              value={accessKeyInput}
              onChange={(e) => setAccessKeyInput(e.target.value)}
              placeholder="Enter Access Key (e.g. ACCESS-XYZ)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none font-mono text-center tracking-wider uppercase"
            />
            {accessError && <p className="text-red-500 text-sm text-center">{accessError}</p>}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Activate System'}
            </button>
          </form>
          
          <button onClick={handleLogout} className="w-full mt-4 text-gray-500 hover:text-white text-sm">
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-gray-900">M</div>
          <h1 className="font-bold text-lg hidden sm:block">MR SUCCESS</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            SYSTEM ACTIVE
          </div>
          {user.isAdmin && (
            <button onClick={() => navigate('/admin')} className="text-sm text-gray-400 hover:text-white">
              Admin Panel
            </button>
          )}
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">
            Logout
          </button>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Feed & History */}
        <div className="lg:col-span-1 space-y-6">
          <LiveMultiplierFeed />
          <HistoryPanel />
        </div>

        {/* Center Column: Main Predictor */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[50vh] lg:min-h-[70vh] bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          
          <CircleMultiplier />
          
          <div className="mt-8 w-full max-w-md">
            <PredictButton />
          </div>
        </div>
      </main>
    </div>
  );
}
