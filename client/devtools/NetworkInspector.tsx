import React, { useState, useEffect } from 'react';

export default function NetworkInspector() {
  const [config, setConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/dev/network-config');
      setConfig(await res.json());
    } catch (e) {
      console.error('Failed to fetch network config');
    }
  };

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateConfig = async (updates: any) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/dev/network-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      setConfig(await res.json());
    } catch (e) {
      console.error('Failed to update config');
    }
    setIsSaving(false);
  };

  const toggleScraper = async () => {
    try {
      const res = await fetch('/api/dev/scraper-toggle', { method: 'POST' });
      setConfig(await res.json());
    } catch (e) {
      console.error('Failed to toggle scraper');
    }
  };

  if (!config) return <div className="text-gray-500">Loading network config...</div>;

  return (
    <div className="flex flex-col h-full space-y-3 overflow-y-auto pb-4 pr-1 custom-scrollbar">
      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
        <span className="text-xs text-gray-400">Network & Scraper</span>
        <span className={`text-[10px] px-2 py-0.5 rounded ${config.isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
          {config.status}
        </span>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Connection Method</label>
        <div className="flex gap-2">
          <button 
            onClick={() => updateConfig({ method: 'websocket' })}
            className={`flex-1 py-1.5 text-xs rounded border transition-colors ${config.method === 'websocket' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
          >
            Raw WebSocket
          </button>
          <button 
            onClick={() => updateConfig({ method: 'puppeteer' })}
            className={`flex-1 py-1.5 text-xs rounded border transition-colors ${config.method === 'puppeteer' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
          >
            Headless Browser
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wider">User Agent Spoofing</label>
        <select 
          value={config.userAgent}
          onChange={(e) => updateConfig({ userAgent: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-[10px] text-white outline-none focus:border-emerald-500"
        >
          <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36">Chrome (Windows)</option>
          <option value="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36">Chrome (Mac)</option>
          <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0">Firefox (Windows)</option>
          <option value="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0">Firefox (Mac)</option>
          <option value="Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1">Safari (iPhone)</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Proxy Server (Optional)</label>
        <input 
          type="text" 
          placeholder="http://user:pass@ip:port"
          value={config.proxy}
          onChange={(e) => updateConfig({ proxy: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white outline-none focus:border-emerald-500 placeholder-gray-600"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Target URL</label>
        <input 
          type="text" 
          value={config.method === 'websocket' ? config.targetUrl : config.targetWebUrl}
          onChange={(e) => updateConfig(config.method === 'websocket' ? { targetUrl: e.target.value } : { targetWebUrl: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white outline-none focus:border-emerald-500 placeholder-gray-600"
        />
      </div>

      <button
        onClick={toggleScraper}
        disabled={isSaving}
        className={`w-full py-2 rounded font-bold text-xs mt-4 transition-colors ${
          config.isRunning 
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50'
        }`}
      >
        {config.isRunning ? 'STOP SCRAPER' : 'START SCRAPER'}
      </button>
    </div>
  );
}
