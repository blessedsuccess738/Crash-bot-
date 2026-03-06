import React, { useState, useEffect, useRef } from 'react';
import { crashResources } from '../config/crashResources';

export default function RemoteBrowser() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true); // Auto-start assumption
  const [logs, setLogs] = useState<any[]>([]);
  const [evalCode, setEvalCode] = useState('');
  const [evalResult, setEvalResult] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-start the browser when the panel is opened
    startBrowser();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/dev/remote-browser/screenshot');
          const data = await res.json();
          if (data.image) {
            setImageSrc(`data:image/jpeg;base64,${data.image}`);
          }
          
          // Fetch logs
          const logsRes = await fetch('/api/dev/remote-browser/logs');
          const logsData = await logsRes.json();
          if (logsData.logs) {
            setLogs(logsData.logs);
          }
        } catch (e) {
          console.error("Failed to fetch screenshot/logs", e);
        }
      }, 500); // 2 FPS to save bandwidth
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    // Auto-scroll logs
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const [config, setConfig] = useState({
    targetWebUrl: '',
  });

  useEffect(() => {
    // Fetch initial config
    fetch('/api/dev/network-config')
      .then(res => res.json())
      .then(data => {
        setConfig({
          targetWebUrl: data.targetWebUrl || 'https://bc.game/game/crash',
        });
      });
  }, []);

  const handleNavigate = async () => {
    await updateConfig();
    if (isActive) {
      await fetch('/api/dev/remote-browser/start', { method: 'POST' });
    }
  };

  const handleResourceSelect = (url: string) => {
    setConfig({ ...config, targetWebUrl: url });
  };

  return (
    <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-hidden shadow-2xl mt-6">
      <div className="p-4 border-b border-gray-800 bg-[#050505] flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <h2 className="font-bold text-lg text-gray-200">Remote Browser & DevTools</h2>
          </div>
          <div className="space-x-2">
            <button 
              onClick={startBrowser}
              className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
              }`}
            >
              {isActive ? 'Restart Session' : 'Start Browser'}
            </button>
          </div>
        </div>

        <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider">Target URL</label>
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-[500px] scrollbar-thin scrollbar-thumb-gray-800">
                {crashResources.map((site) => (
                  <button
                    key={site.name}
                    onClick={() => handleResourceSelect(site.url)}
                    className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-0.5 rounded transition-colors border border-gray-700 whitespace-nowrap"
                  >
                    {site.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={config.targetWebUrl}
                onChange={e => setConfig({...config, targetWebUrl: e.target.value})}
                className="flex-1 bg-black border border-gray-800 rounded px-3 py-2 text-sm text-emerald-400 font-mono focus:border-emerald-500/50 focus:outline-none transition-colors"
                placeholder="https://bc.game/game/crash"
              />
              <button 
                onClick={handleNavigate}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded text-sm font-bold transition-colors border border-gray-700"
              >
                GO
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row h-[600px] lg:h-[700px]">
        {/* Left Side: Video Feed */}
        <div className="flex-1 bg-black flex items-center justify-center relative border-r border-gray-800 overflow-hidden group">
          {imageSrc ? (
            <img 
              ref={imgRef}
              src={imageSrc} 
              alt="Remote Browser" 
              className="w-full h-full object-contain cursor-crosshair"
              onClick={handleClick}
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-600 font-mono gap-4">
              <div className="w-12 h-12 border-2 border-gray-800 border-t-emerald-500 rounded-full animate-spin"></div>
              <p>{isActive ? 'Connecting to video feed...' : 'Browser Offline'}</p>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur text-[10px] text-gray-500 px-2 py-1 rounded border border-gray-800 pointer-events-none">
            REMOTE VIEW • 800x600 • LIVE
          </div>
        </div>

        {/* Right Side: DevTools */}
        <div className="w-full lg:w-[400px] flex flex-col bg-[#050505] border-l border-gray-800">
          {/* Console Header */}
          <div className="px-4 py-2 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Console</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 font-mono">{logs.length} events</span>
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] text-gray-500 hover:text-white transition-colors"
                title="Clear Console"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Logs Area */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {logs.length === 0 ? (
              <div className="text-gray-700 italic p-2 text-center mt-10">No logs captured yet...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`p-1 rounded border-l-2 pl-2 break-words ${
                  log.type === 'error' ? 'border-red-500 bg-red-900/10 text-red-400' : 
                  log.type === 'warning' ? 'border-yellow-500 bg-yellow-900/10 text-yellow-400' : 
                  'border-gray-700 text-gray-300'
                }`}>
                  <span className="text-gray-600 mr-2 select-none">[{log.time}]</span>
                  <span className="whitespace-pre-wrap">{log.text}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-2 border-t border-gray-800 bg-[#0a0a0a]">
            <form onSubmit={handleEval} className="flex flex-col gap-2">
              <div className="relative">
                <span className="absolute left-2 top-2 text-emerald-500 font-mono">{'>'}</span>
                <textarea 
                  value={evalCode}
                  onChange={(e) => setEvalCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEval(e);
                    }
                  }}
                  placeholder="Execute JavaScript..."
                  className="w-full bg-black border border-gray-800 rounded pl-6 pr-2 py-2 text-xs text-emerald-400 font-mono outline-none focus:border-gray-700 h-20 resize-none"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-600">Shift+Enter for new line</span>
                <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1 rounded text-xs font-bold transition-colors border border-gray-700">
                  Run
                </button>
              </div>
            </form>
            
            {evalResult && (
              <div className="mt-2 p-2 bg-[#0f0f0f] border border-gray-800 rounded text-xs font-mono text-blue-400 overflow-x-auto max-h-32 scrollbar-thin">
                <div className="text-[10px] text-gray-600 mb-1 uppercase">Result:</div>
                <pre>{evalResult}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
