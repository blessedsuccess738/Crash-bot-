import React, { useState, useEffect } from 'react';

export default function EngineMonitor() {
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/dev/engine-status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch engine status');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleEngine = async () => {
    try {
      const res = await fetch('/api/dev/engine-toggle', { method: 'POST' });
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to toggle engine');
    }
  };

  if (!status) return <div className="text-gray-500">Loading engine stats...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Status:</span>
        <span className={`font-bold ${status.isRunning ? 'text-emerald-400' : 'text-red-400'}`}>
          {status.isRunning ? 'RUNNING' : 'STOPPED'}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Total Predictions:</span>
        <span className="text-blue-400">{status.stats.totalPredictions}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-400">Avg Latency:</span>
        <span className="text-yellow-400">{status.stats.averageLatency.toFixed(2)}ms</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-400">Uptime:</span>
        <span className="text-purple-400">{(status.stats.currentUptime / 1000).toFixed(1)}s</span>
      </div>

      <button
        onClick={toggleEngine}
        className={`w-full py-2 rounded font-bold text-xs mt-4 ${
          status.isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
        }`}
      >
        {status.isRunning ? 'STOP ENGINE' : 'START ENGINE'}
      </button>
    </div>
  );
}
