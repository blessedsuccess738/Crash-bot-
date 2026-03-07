import React, { useState, useEffect, useRef } from 'react';
import { crashResources } from '../config/crashResources';
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, Lock, Star, 
  MoreVertical, Plus, X, Search, LayoutPanelLeft, 
  Terminal, Activity, MousePointer2, PlayCircle 
} from 'lucide-react';

export default function RemoteBrowser() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true); // Auto-start assumption
  const [logs, setLogs] = useState<any[]>([]);
  const [evalCode, setEvalCode] = useState('');
  const [evalResult, setEvalResult] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [selectedBrowser, setSelectedBrowser] = useState('chrome');
  const [isAutoStart, setIsAutoStart] = useState(true);
  const [status, setStatus] = useState('Offline');
  const [config, setConfig] = useState({
    targetWebUrl: 'https://bc.game/game/crash'
  });

  const [tabs, setTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // ... existing handlers ...
  
  const fetchTabs = async () => {
    try {
      const res = await fetch('/api/dev/remote-browser/tabs');
      const data = await res.json();
      setTabs(data.tabs || []);
      const active = data.tabs.find((t: any) => t.active);
      if (active) {
        setActiveTabId(active.id);
        setConfig(prev => ({ ...prev, targetWebUrl: active.url }));
      }
    } catch (e) {
      console.error("Failed to fetch tabs", e);
    }
  };

  const handleNewTab = async () => {
    await fetch('/api/dev/remote-browser/tabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'about:blank' })
    });
    fetchTabs();
  };

  const handleSwitchTab = async (id: string) => {
    await fetch(`/api/dev/remote-browser/tabs/${id}/switch`, { method: 'POST' });
    setActiveTabId(id);
    fetchTabs();
  };

  const handleCloseTab = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/dev/remote-browser/tabs/${id}`, { method: 'DELETE' });
    fetchTabs();
  };

  const handleBack = async () => {
    await fetch('/api/dev/remote-browser/back', { method: 'POST' });
  };

  const handleForward = async () => {
    await fetch('/api/dev/remote-browser/forward', { method: 'POST' });
  };

  const handleReload = async () => {
    await fetch('/api/dev/remote-browser/reload', { method: 'POST' });
  };

  const handleResourceSelect = (url: string) => {
    if (activeTabId) {
      // Navigate current tab
      setConfig(prev => ({ ...prev, targetWebUrl: url }));
      startBrowser(url);
    } else {
      // Create new tab if none active
      fetch('/api/dev/remote-browser/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }).then(() => fetchTabs());
    }
  };

  const startBrowser = async (targetUrl?: string, force = false) => {
    const urlToUse = targetUrl || config.targetWebUrl;
    
    // Check if already running before starting unless force
    if (!force) {
      try {
        const checkRes = await fetch('/api/dev/network-config');
        const checkData = await checkRes.json();
        if (checkData.isRunning && checkData.status.includes('Connected')) {
          console.log("Browser already running, skipping start");
          setIsActive(true);
          fetchTabs();
          return;
        }
      } catch (e) {}
    }

    setIsActive(true);
    setStatus('Navigating...');
    
    if (targetUrl) {
      setConfig(prev => ({ ...prev, targetWebUrl: targetUrl }));
    }

    try {
      await fetch('/api/dev/remote-browser/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: urlToUse,
          browser: selectedBrowser,
          force
        })
      });
      fetchTabs();
    } catch (e) {
      console.error("Failed to start browser", e);
      setStatus('Connection Failed');
    }
  };

  useEffect(() => {
    if (isAutoStart) {
      startBrowser();
    }
    const tabInterval = setInterval(fetchTabs, 2000);
    return () => clearInterval(tabInterval);
  }, []);

  // ... existing handlers ...
  const [activeTab, setActiveTab] = useState<'web' | 'console' | 'network' | 'inspector' | 'automation' | 'system'>('web');
  const [inspectMode, setInspectMode] = useState(true);
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [inspectedElement, setInspectedElement] = useState<any>(null);
  const [hoveredRect, setHoveredRect] = useState<{x: number, y: number, width: number, height: number} | null>(null);

  const handleMouseMove = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!inspectMode || !imgRef.current) {
      if (hoveredRect) setHoveredRect(null);
      return;
    }
    
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    try {
      const res = await fetch('/api/dev/remote-browser/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: x * scaleX, y: y * scaleY })
      });
      const data = await res.json();
      if (data.element && data.element.rect) {
        setHoveredRect({
          x: data.element.rect.x / scaleX,
          y: data.element.rect.y / scaleY,
          width: data.element.rect.width / scaleX,
          height: data.element.rect.height / scaleY
        });
      } else {
        setHoveredRect(null);
      }
    } catch (err) {
      setHoveredRect(null);
    }
  };

  const handleClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
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

        // Auto run click on the element in the remote browser
        await fetch('/api/dev/remote-browser/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: x * scaleX, y: y * scaleY })
        });
      } catch (err) {
        console.error("Inspect/Click failed", err);
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
          const configRes = await fetch('/api/dev/network-config');
          const configData = await configRes.json();
          setStatus(configData.status || 'Offline');

          if (activeTab === 'web' || activeTab === 'inspector') {
            const res = await fetch('/api/dev/remote-browser/screenshot');
            const data = await res.json();
            if (data.image) {
              setImageSrc(`data:image/jpeg;base64,${data.image}`);
            }
          }
          
          if (activeTab === 'console') {
            const logsRes = await fetch('/api/dev/remote-browser/logs');
            const logsData = await logsRes.json();
            if (logsData.logs) setLogs(logsData.logs);
          } else if (activeTab === 'network') {
            const netRes = await fetch('/api/dev/remote-browser/network');
            const netData = await netRes.json();
            if (netData.logs) setNetworkLogs(netData.logs);
          } else if (activeTab === 'system') {
            const sysRes = await fetch('/api/dev/remote-browser/system-logs');
            const sysData = await sysRes.json();
            if (sysData.logs) setSystemLogs(sysData.logs);
          }
        } catch (e) {
          console.error("Failed to fetch data", e);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isActive, activeTab]);

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

  // Helper to get domain for tab title
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'New Tab';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Browser Window Container */}
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden shadow-2xl border border-[#333] flex flex-col h-[800px]">
        
        {/* Browser Chrome (Top Bar) */}
        <div className="bg-[#2D2D2D] p-2 flex flex-col gap-2">
          
          {/* Tab Bar */}
          <div className="flex items-center gap-2 px-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 mr-4 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
            </div>
            
            {/* Tabs */}
            {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => handleSwitchTab(tab.id)}
                className={`flex-1 max-w-[240px] min-w-[120px] rounded-t-lg px-3 py-2 flex items-center justify-between group relative cursor-pointer transition-colors ${
                  tab.id === activeTabId ? 'bg-[#1E1E1E]' : 'bg-[#2D2D2D] hover:bg-[#383838]'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <img src={`https://www.google.com/s2/favicons?domain=${tab.url}`} alt="" className="w-4 h-4 opacity-80" />
                  <span className={`text-xs truncate font-medium ${tab.id === activeTabId ? 'text-gray-300' : 'text-gray-500'}`}>
                    {getDomain(tab.url)}
                  </span>
                </div>
                <button 
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className="p-0.5 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3 h-3 text-gray-500 hover:text-white" />
                </button>
                {/* Active Indicator Line */}
                {tab.id === activeTabId && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500"></div>
                )}
              </div>
            ))}

            {/* New Tab Button */}
            <button 
              onClick={handleNewTab}
              className="p-1 hover:bg-[#3D3D3D] rounded-full transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Navigation & Address Bar */}
          <div className="bg-[#1E1E1E] rounded-lg flex items-center gap-2 px-3 py-1.5 mx-2">
            <div className="flex gap-1">
              <button onClick={handleBack} className="p-1 hover:bg-[#333] rounded transition-colors disabled:opacity-30">
                <ArrowLeft className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={handleForward} className="p-1 hover:bg-[#333] rounded transition-colors disabled:opacity-30">
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
              <button 
                onClick={handleReload}
                className="p-1 hover:bg-[#333] rounded transition-colors"
                title="Refresh Page"
              >
                <RotateCw className="w-4 h-4 text-gray-400" />
              </button>
              <button 
                onClick={() => startBrowser(config.targetWebUrl, true)}
                className={`p-1 hover:bg-[#333] rounded transition-colors ${isActive ? '' : 'animate-spin'}`}
                title="Force Restart Browser"
              >
                <RotateCw className="w-4 h-4 text-emerald-500" />
              </button>
              <button 
                onClick={() => handleResourceSelect('https://bc.game/game/crash')}
                className="p-1 hover:bg-[#333] rounded transition-colors"
                title="Go Home"
              >
                <Home className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Address Input */}
            <div className="flex-1 bg-[#121212] rounded-full border border-[#333] flex items-center px-3 py-1 gap-2 focus-within:border-emerald-500/50 transition-colors">
              <Lock className="w-3 h-3 text-emerald-500" />
              <input 
                type="text"
                value={config.targetWebUrl}
                onChange={(e) => setConfig({...config, targetWebUrl: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && startBrowser(config.targetWebUrl)}
                className="flex-1 bg-transparent text-sm text-gray-300 focus:outline-none font-mono"
              />
              <Star className="w-3 h-3 text-gray-600 hover:text-yellow-400 cursor-pointer transition-colors" />
            </div>

            <button 
              onClick={handleReload}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#333] hover:bg-[#444] rounded-full text-[11px] font-medium text-gray-300 transition-all border border-[#444] hover:border-emerald-500/30"
              title="Reload Browser Page"
            >
              <RotateCw className="w-3 h-3 text-emerald-400" />
              Reload
            </button>

            {/* Menu / Settings */}
            <div className="flex gap-1">
               <div className="relative group">
                 <button className="p-1 hover:bg-[#333] rounded transition-colors">
                   <MoreVertical className="w-4 h-4 text-gray-400" />
                 </button>
                 {/* Quick Bookmarks Dropdown */}
                 <div className="absolute right-0 top-full mt-2 w-48 bg-[#2D2D2D] border border-[#444] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
                   {crashResources.map((site) => (
                     <button
                       key={site.name}
                       onClick={() => handleResourceSelect(site.url)}
                       className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#3D3D3D] rounded flex items-center gap-2"
                     >
                       <img src={`https://www.google.com/s2/favicons?domain=${site.url}`} alt="" className="w-3 h-3" />
                       {site.name}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Main Content Area (Viewport + DevTools) */}
        <div className="flex-1 flex relative bg-[#121212]">
          
          {/* Web ViewPORT */}
          <div className={`flex-1 relative flex flex-col ${activeTab !== 'web' && activeTab !== 'inspector' ? 'hidden' : ''}`}>
             {/* Status Bar Overlay */}
             {status !== 'Connected (Puppeteer Active)' && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 backdrop-blur border border-gray-800 text-white px-4 py-2 rounded-full text-xs font-mono flex items-center gap-2 shadow-lg">
                 <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                 {status}
               </div>
             )}

             <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
                {imageSrc ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      ref={imgRef}
                      src={imageSrc} 
                      alt="Remote Browser" 
                      className={`max-w-full max-h-full object-contain ${inspectMode ? 'cursor-help' : 'cursor-default'}`}
                      onClick={handleClick}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoveredRect(null)}
                      draggable={false}
                    />
                    {/* Hover Highlight Overlay */}
                    {inspectMode && hoveredRect && (
                      <div 
                        className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-10 transition-all duration-75"
                        style={{
                          left: hoveredRect.x,
                          top: hoveredRect.y,
                          width: hoveredRect.width,
                          height: hoveredRect.height
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-600 gap-4">
                    <div className="w-16 h-16 border-4 border-[#333] border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="font-mono text-sm">Waiting for video stream...</p>
                  </div>
                )}
             </div>
          </div>

          {/* DevTools Panel (Conditional Render) */}
          {activeTab !== 'web' && activeTab !== 'inspector' && (
            <div className="flex-1 bg-[#0D0D0D] flex flex-col">
               {/* Console Tab */}
               {activeTab === 'console' && (
                 <div className="flex-1 flex flex-col">
                   <div className="p-2 border-b border-[#333] flex justify-between items-center bg-[#1E1E1E]">
                     <span className="text-xs font-bold text-gray-400">Console</span>
                     <button onClick={() => setLogs([])} className="text-[10px] hover:text-white text-gray-500">Clear</button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                     {logs.map((log, i) => (
                       <div key={i} className={`p-1 border-l-2 pl-2 ${
                         log.type === 'error' ? 'border-red-500 text-red-400 bg-red-900/10' : 
                         log.type === 'warning' ? 'border-yellow-500 text-yellow-400 bg-yellow-900/10' : 
                         'border-gray-600 text-gray-300'
                       }`}>
                         <span className="opacity-50 mr-2">[{log.time}]</span>
                         {log.text}
                       </div>
                     ))}
                     <div ref={logsEndRef} />
                   </div>
                   <form onSubmit={handleEval} className="p-2 border-t border-[#333] bg-[#1E1E1E] flex gap-2">
                     <span className="text-emerald-500 font-mono">{'>'}</span>
                     <input 
                       value={evalCode}
                       onChange={(e) => setEvalCode(e.target.value)}
                       className="flex-1 bg-transparent text-xs font-mono text-gray-300 focus:outline-none"
                       placeholder="Run JavaScript..."
                     />
                   </form>
                 </div>
               )}

               {/* Network Tab */}
               {activeTab === 'network' && (
                 <div className="flex-1 flex flex-col">
                    <div className="p-2 border-b border-[#333] bg-[#1E1E1E]">
                      <span className="text-xs font-bold text-gray-400">Network</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#1E1E1E] text-gray-500 sticky top-0">
                          <tr>
                            <th className="p-2 w-16">Status</th>
                            <th className="p-2 w-16">Method</th>
                            <th className="p-2">Resource</th>
                          </tr>
                        </thead>
                        <tbody>
                          {networkLogs.map((req, i) => (
                            <tr key={i} className="border-b border-[#222] hover:bg-[#222]">
                              <td className={`p-2 ${req.status >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>{req.status}</td>
                              <td className="p-2 text-gray-400">{req.method}</td>
                              <td className="p-2 text-gray-300 truncate max-w-[300px]">{req.url.split('/').pop() || req.url}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {/* System Logs Tab */}
               {activeTab === 'system' && (
                 <div className="flex-1 flex flex-col">
                   <div className="p-2 border-b border-[#333] bg-[#1E1E1E]">
                     <span className="text-xs font-bold text-gray-400">System Logs</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1">
                     {systemLogs.map((log, i) => (
                       <div key={i} className="text-gray-400 border-b border-[#222] pb-1">
                         <span className="text-emerald-500/50 mr-2">[{log.time}]</span>
                         {log.text}
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Automation Tab */}
               {activeTab === 'automation' && (
                 <div className="flex-1 p-4 grid grid-cols-2 gap-4 content-start">
                    <button className="bg-[#1E1E1E] hover:bg-[#2D2D2D] p-4 rounded border border-[#333] flex flex-col items-center gap-2">
                      <PlayCircle className="w-8 h-8 text-emerald-500" />
                      <span className="text-xs font-bold text-gray-300">Run Auto-Clicker</span>
                    </button>
                    <button className="bg-[#1E1E1E] hover:bg-[#2D2D2D] p-4 rounded border border-[#333] flex flex-col items-center gap-2">
                      <RotateCw className="w-8 h-8 text-blue-500" />
                      <span className="text-xs font-bold text-gray-300">Refresh Loop</span>
                    </button>
                 </div>
               )}
            </div>
          )}

          {/* Inspector Side Panel (Overlay) */}
          {activeTab === 'inspector' && (
            <div className="w-[300px] bg-[#0D0D0D] border-l border-[#333] flex flex-col">
              <div className="p-2 border-b border-[#333] flex justify-between items-center bg-[#1E1E1E]">
                <span className="text-xs font-bold text-gray-400">Inspector</span>
                <button 
                  onClick={() => setInspectMode(!inspectMode)}
                  className={`p-1 rounded ${inspectMode ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
                >
                  <MousePointer2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-xs text-gray-400">
                {inspectedElement ? (
                  <div className="space-y-2">
                    <div className="text-blue-400">&lt;{inspectedElement.tagName.toLowerCase()}</div>
                    {Object.entries(inspectedElement.attributes).map(([k, v]: any) => (
                      <div key={k} className="pl-2">
                        <span className="text-purple-400">{k}</span>=
                        <span className="text-green-400">"{v}"</span>
                      </div>
                    ))}
                    <div className="text-white pl-2 my-2">{inspectedElement.innerText}</div>
                    <div className="text-blue-400">&gt;</div>
                  </div>
                ) : (
                  <div className="text-center mt-10 italic opacity-50">Select an element...</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom DevTools Toggle Bar */}
        <div className="bg-[#1E1E1E] border-t border-[#333] p-1 flex gap-1">
          {[
            { id: 'web', icon: LayoutPanelLeft, label: 'View' },
            { id: 'console', icon: Terminal, label: 'Console' },
            { id: 'network', icon: Activity, label: 'Network' },
            { id: 'system', icon: Terminal, label: 'System' },
            { id: 'inspector', icon: Search, label: 'Inspect' },
            { id: 'automation', icon: PlayCircle, label: 'Macros' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-[#333] text-white' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#2D2D2D]'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
