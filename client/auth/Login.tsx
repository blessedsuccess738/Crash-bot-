import React, { useState, useEffect } from 'react';
import { useAuth } from './sessionManager';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import InstallApp from '../components/InstallApp';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const [casinoName, setCasinoName] = useState('BC Game');
  const [casinoLoginUrl, setCasinoLoginUrl] = useState('https://bc.game/login/signin');

  useEffect(() => {
    // Fetch current casino config from backend
    fetch('/api/dev/network-config')
      .then(res => res.json())
      .then(data => {
        if (data.targetWebUrl) {
          if (data.targetWebUrl.includes('1xbet')) {
            setCasinoName('1xBet');
            setCasinoLoginUrl('https://1xbet.ng/en/user/login');
          } else if (data.targetWebUrl.includes('bc.game')) {
            setCasinoName('BC Game');
            setCasinoLoginUrl('https://bc.game/login/signin');
          } else {
            // Generic fallback or extract domain
            try {
              const url = new URL(data.targetWebUrl);
              const name = url.hostname.replace('www.', '').split('.')[0];
              setCasinoName(name.charAt(0).toUpperCase() + name.slice(1));
              setCasinoLoginUrl(url.origin);
            } catch (e) {
              setCasinoName('Casino');
              setCasinoLoginUrl(data.targetWebUrl);
            }
          }
        }
      })
      .catch(err => console.error('Failed to fetch casino config', err));
  }, []);

  const handleCasinoLogin = () => {
    window.open(casinoLoginUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md mb-6">
        <InstallApp />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700"
      >
        <h2 className="text-3xl font-bold text-center text-emerald-400 mb-2">MR SUCCESS</h2>
        <p className="text-center text-gray-400 mb-8">Crash Predictor System</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login to System'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleCasinoLogin}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <span>Login to {casinoName}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </button>
          
          <p className="text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
