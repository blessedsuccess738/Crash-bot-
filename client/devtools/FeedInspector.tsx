import React, { useState, useEffect } from 'react';

export default function FeedInspector() {
  const [feed, setFeed] = useState<any[]>([]);

  useEffect(() => {
    // We can listen to the global window event for the feed
    const handleFeed = (e: any) => {
      setFeed(prev => [e.detail, ...prev].slice(0, 10));
    };
    window.addEventListener('crash-feed-update', handleFeed);
    return () => window.removeEventListener('crash-feed-update', handleFeed);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
        <span className="text-xs text-gray-400">Live Feed Data</span>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2">
        {feed.map((item, i) => (
          <div key={i} className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <div className="flex justify-between text-gray-400 mb-1">
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              <span className="text-emerald-400 font-bold">{item.value}x</span>
            </div>
            <div className="text-[10px] text-gray-500 break-all">
              {JSON.stringify(item)}
            </div>
          </div>
        ))}
        {feed.length === 0 && <div className="text-gray-600 italic">Waiting for feed data...</div>}
      </div>
    </div>
  );
}
