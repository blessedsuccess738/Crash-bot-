import React, { useState, useEffect, useRef } from 'react';

export default function RemoteBrowser() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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
        } catch (e) {
          console.error("Failed to fetch screenshot", e);
        }
      }, 500); // 2 FPS to save bandwidth
    }
    return () => clearInterval(interval);
  }, [isActive]);

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
    // Puppeteer default viewport is 800x600. Let's scale the click coordinates.
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

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl mt-6">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
        <h2 className="font-bold text-lg">Remote Browser (Cloud Bypass)</h2>
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
      <div className="p-4 flex flex-col items-center">
        <p className="text-sm text-gray-400 mb-4 text-center">
          This is a live video feed of the invisible browser running on the cloud server. <br/>
          Click on the screen to interact, type your login details, and click "Go to Crash Game" when done.
        </p>
        
        <div 
          className="relative bg-black border border-gray-600 rounded overflow-hidden shadow-2xl"
          style={{ width: '800px', height: '600px', maxWidth: '100%' }}
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
    </div>
  );
}
