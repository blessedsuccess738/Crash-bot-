import React, { useState, useEffect } from 'react';

export default function NetworkInspector() {
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/dev/remote-browser/network');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.error('Failed to fetch network logs');
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Network Requests</span>
        <span className="text-[9px] text-gray-500">{logs.length} requests</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {logs.length === 0 ? (
          <div className="text-gray-600 italic text-center py-4">No requests captured</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] border-b border-gray-900 pb-1 hover:bg-white/5 px-1">
              <span className={`font-bold w-8 ${log.status >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                {log.status}
              </span>
              <span className="text-gray-500 w-10 uppercase">{log.method}</span>
              <span className="text-gray-300 truncate flex-1" title={log.url}>
                {log.url.split('/').pop() || log.url}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
