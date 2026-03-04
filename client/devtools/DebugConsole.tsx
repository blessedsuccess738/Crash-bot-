import React, { useState, useEffect } from 'react';

export default function DebugConsole({ logs, onClear }: { logs: string[], onClear: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
        <span className="text-xs text-gray-400">Console Output</span>
        <button onClick={onClear} className="text-xs text-gray-500 hover:text-white">Clear</button>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs text-green-300 space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="break-words opacity-80 hover:opacity-100">{log}</div>
        ))}
        {logs.length === 0 && <div className="text-gray-600 italic">No logs captured...</div>}
      </div>
    </div>
  );
}
