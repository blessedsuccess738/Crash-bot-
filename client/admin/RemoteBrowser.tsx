import React, { useState, useEffect, useRef } from 'react';

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

  const startBrowser = async () => {
    await fetch('/api/dev/remote-browser/start', { method: 'POST' });
    setIsActive(true);
  };

  const goToCrash = async () => {
    await fetch('/api/dev/remote-browser/go-to-crash', { method: 'POST' });
  };

  const handleClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    
    // Calculate the scale between the displayed image and the actual puppeteer viewport (assume 800x600 default)
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    await fetch('/api/dev/remote-browser/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y })
    });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.key.length === 1) {
      await fetch('/api/dev/remote-browser/type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: e.key })
      });
    } else {
      await fetch('/api/dev/remote-browser/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: e.key })
      });
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
      if (data.error) {
        setEvalResult(`Error: ${data.error}`);
      } else {
        setEvalResult(JSON.stringify(data.result, null, 2));
      }
    } catch (err) {
      setEvalResult(`Error: ${err}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl mt-6">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
        <h2 className="font-bold text-lg">Remote Browser & DevTools</h2>
        <div className="space-x-2">
          <button 
            onClick={startBrowser}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-bold transition-colors"
          >
            {isActive ? 'Restart Browser' : 'Start Remote Browser'}
          </button>
          {isActive && (
            <button 
              onClick={goToCrash}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded text-sm font-bold transition-colors"
            >
              Go to Crash Game
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row border-t border-gray-700">
        {/* Left Side: Video Feed */}
        <div className="p-4 flex flex-col items-center lg:w-2/3 border-r border-gray-700">
          <p className="text-sm text-gray-400 mb-4 text-center">
            Live video feed of the invisible browser running on the cloud server. <br/>
            Click on the screen to interact, type your login details, and click "Go to Crash Game" when done.
          </p>
          
          <div 
            className="relative bg-black border border-gray-600 rounded overflow-hidden shadow-2xl w-full"
            style={{ aspectRatio: '800/600', maxWidth: '800px' }}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
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
              <div className="flex items-center justify-center h-full text-gray-500 font-mono">
                {isActive ? 'Loading stream...' : 'Browser Offline'}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: DevTools */}
        <div className="p-4 lg:w-1/3 flex flex-col bg-gray-900/50 h-[600px] lg:h-auto">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Console Logs</h3>
          <div className="flex-1 bg-black border border-gray-700 rounded p-2 overflow-y-auto font-mono text-xs mb-4">
            {logs.length === 0 ? (
              <div className="text-gray-600 italic">Waiting for logs...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'}`}>
                  <span className="text-gray-600 mr-2">[{log.time}]</span>
                  {log.text}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Execute JS</h3>
          <form onSubmit={handleEval} className="flex flex-col gap-2">
            <textarea 
              value={evalCode}
              onChange={(e) => setEvalCode(e.target.value)}
              placeholder="document.querySelector('title').innerText"
              className="w-full bg-black border border-gray-700 rounded p-2 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500 h-20"
            />
            <button type="submit" className="bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded text-xs font-bold transition-colors">
              Run Script
            </button>
          </form>
          
          {evalResult && (
            <div className="mt-2 p-2 bg-black border border-gray-700 rounded text-xs font-mono text-blue-400 overflow-x-auto max-h-32">
              {evalResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
