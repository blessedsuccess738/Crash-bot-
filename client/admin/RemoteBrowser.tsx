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

  const startBrowser = async (targetUrl?: string) => {
    const urlToUse = targetUrl || config.targetWebUrl;
    setIsActive(true);
    
    // Update the input field visually if a specific URL was passed
    if (targetUrl) {
      setConfig(prev => ({ ...prev, targetWebUrl: targetUrl }));
    }

    try {
      await fetch('/api/dev/remote-browser/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToUse })
      });
    } catch (e) {
      console.error("Failed to start browser", e);
    }
  };

  const handleEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalCode.trim()) return;
    
    try {
      const res = await fetch('/api/dev/remote-browser/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: evalCode })
      });
      const data = await res.json();
      setEvalResult(JSON.stringify(data.result, null, 2));
    } catch (err) {
      setEvalResult("Error executing code");
    }
  };

  useEffect(() => {
    // Auto-start the browser when the panel is opened
    startBrowser();
  }, []);

  const [activeTab, setActiveTab] = useState<'console' | 'network' | 'inspector'>('console');
  const [inspectMode, setInspectMode] = useState(false);
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);
  const [inspectedElement, setInspectedElement] = useState<any>(null);

  const handleClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates if image is resized
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    if (inspectMode) {
      try {
        const res = await fetch('/api/dev/remote-browser/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: x * scaleX, y: y * scaleY })
        });
        const data = await res.json();
        setInspectedElement(data.element);
        setActiveTab('inspector');
      } catch (err) {
        console.error("Inspect failed", err);
      }
    } else {
      try {
        await fetch('/api/dev/remote-browser/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: x * scaleX, y: y * scaleY })
        });
      } catch (err) {
        console.error("Click failed", err);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(async () => {
        try {
          // Fetch status
          const configRes = await fetch('/api/dev/network-config');
          const configData = await configRes.json();
          setStatus(configData.status || 'Offline');

          const res = await fetch('/api/dev/remote-browser/screenshot');
          const data = await res.json();
          if (data.image) {
            setImageSrc(`data:image/jpeg;base64,${data.image}`);
          }
          
          // Fetch logs based on active tab
          if (activeTab === 'console') {
            const logsRes = await fetch('/api/dev/remote-browser/logs');
            const logsData = await logsRes.json();
            if (logsData.logs) setLogs(logsData.logs);
          } else if (activeTab === 'network') {
            const netRes = await fetch('/api/dev/remote-browser/network');
            const netData = await netRes.json();
            if (netData.logs) setNetworkLogs(netData.logs);
          }
        } catch (e) {
          console.error("Failed to fetch data", e);
        }
      }, 500); // 2 FPS to save bandwidth
    }
    return () => clearInterval(interval);
  }, [isActive, activeTab]);

  // ... (rest of useEffects)

  return (
    <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-hidden shadow-2xl mt-6">
      {/* ... (Header) ... */}
      
      <div className="flex flex-col lg:flex-row h-[600px] lg:h-[700px]">
        {/* Left Side: Video Feed */}
        <div className="flex-1 bg-black flex items-center justify-center relative border-r border-gray-800 overflow-hidden group">
          {imageSrc ? (
            <img 
              ref={imgRef}
              src={imageSrc} 
              alt="Remote Browser" 
              className={`w-full h-full object-contain ${inspectMode ? 'cursor-help' : 'cursor-crosshair'}`}
              onClick={handleClick}
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-600 font-mono gap-4">
              <div className="w-12 h-12 border-2 border-gray-800 border-t-emerald-500 rounded-full animate-spin"></div>
              <p>{status}</p>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-none">
             <div className="bg-black/80 backdrop-blur text-[10px] text-gray-500 px-2 py-1 rounded border border-gray-800">
               REMOTE VIEW • 800x600 • LIVE
             </div>
             {inspectMode && (
               <div className="bg-blue-900/80 backdrop-blur text-[10px] text-blue-200 px-2 py-1 rounded border border-blue-800 animate-pulse">
                 INSPECT MODE ACTIVE
               </div>
             )}
          </div>
        </div>

        {/* Right Side: DevTools */}
        <div className="w-full lg:w-[400px] flex flex-col bg-[#050505] border-l border-gray-800">
          {/* Tabs */}
          <div className="flex border-b border-gray-800 bg-[#0a0a0a]">
            {['console', 'network', 'inspector'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Console Tab */}
          {activeTab === 'console' && (
            <>
              <div className="px-4 py-2 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Console Output</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600 font-mono">{logs.length} events</span>
                  <button 
                    onClick={() => setLogs([])}
                    className="text-[10px] text-gray-500 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
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
            </>
          )}

          {/* Network Tab */}
          {activeTab === 'network' && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-2 border-b border-gray-800 bg-[#0a0a0a] flex justify-between">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Network Activity</h3>
                 <span className="text-[10px] text-gray-600 font-mono">{networkLogs.length} requests</span>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-xs scrollbar-thin scrollbar-thumb-gray-800">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0f0f0f] text-gray-500 sticky top-0">
                    <tr>
                      <th className="p-2 font-normal border-b border-gray-800">Status</th>
                      <th className="p-2 font-normal border-b border-gray-800">Method</th>
                      <th className="p-2 font-normal border-b border-gray-800">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkLogs.map((req, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className={`p-2 ${
                          req.status >= 400 ? 'text-red-400' : 
                          req.status >= 300 ? 'text-yellow-400' : 'text-emerald-400'
                        }`}>{req.status}</td>
                        <td className="p-2 text-gray-400">{req.method}</td>
                        <td className="p-2 text-gray-300 truncate max-w-[150px]" title={req.url}>
                          {req.url.split('/').pop() || req.url}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inspector Tab */}
          {activeTab === 'inspector' && (
            <div className="flex-1 flex flex-col p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Element Inspector</h3>
                <button
                  onClick={() => setInspectMode(!inspectMode)}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                    inspectMode 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {inspectMode ? '● Inspecting...' : 'Select Element'}
                </button>
              </div>

              {inspectedElement ? (
                <div className="flex-1 overflow-y-auto space-y-4 font-mono text-xs">
                  <div className="bg-[#0f0f0f] p-3 rounded border border-gray-800">
                    <div className="text-blue-400 font-bold mb-1">&lt;{inspectedElement.tagName.toLowerCase()}</div>
                    {inspectedElement.id && (
                      <div className="pl-4 text-yellow-500">id="{inspectedElement.id}"</div>
                    )}
                    {inspectedElement.className && (
                      <div className="pl-4 text-purple-400">class="{inspectedElement.className}"</div>
                    )}
                    {Object.entries(inspectedElement.attributes).map(([key, val]: any) => (
                      key !== 'id' && key !== 'class' && (
                        <div key={key} className="pl-4 text-gray-400">
                          {key}="<span className="text-green-400">{val}</span>"
                        </div>
                      )
                    ))}
                    <div className="text-blue-400 font-bold mt-1">&gt;</div>
                  </div>

                  {inspectedElement.innerText && (
                    <div className="bg-[#0f0f0f] p-3 rounded border border-gray-800">
                      <div className="text-gray-500 mb-1 uppercase text-[10px]">Content</div>
                      <div className="text-gray-300 whitespace-pre-wrap break-words">
                        {inspectedElement.innerText}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#0f0f0f] p-3 rounded border border-gray-800">
                    <div className="text-gray-500 mb-1 uppercase text-[10px]">Computed Properties</div>
                    <div className="grid grid-cols-2 gap-2 text-gray-400">
                      <div>Width: <span className="text-white">{Math.round(inspectedElement.rect?.width || 0)}px</span></div>
                      <div>Height: <span className="text-white">{Math.round(inspectedElement.rect?.height || 0)}px</span></div>
                      <div>X: <span className="text-white">{Math.round(inspectedElement.rect?.x || 0)}</span></div>
                      <div>Y: <span className="text-white">{Math.round(inspectedElement.rect?.y || 0)}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-600 italic text-center p-4">
                  Click 'Select Element' then click anywhere on the browser view to inspect.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
