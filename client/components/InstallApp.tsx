import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install, tap "Share" then "Add to Home Screen" in your browser menu.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  if (isInstalled) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-900/50 to-blue-900/50 border border-emerald-500/30 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="bg-emerald-500/20 p-3 rounded-full">
          <Smartphone className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Install Mobile App</h3>
          <p className="text-sm text-gray-300">Get the full experience with our native-like app. Faster, smoother, and always accessible.</p>
        </div>
      </div>
      
      <button 
        onClick={handleInstallClick}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 shadow-emerald-500/20 shadow-lg whitespace-nowrap"
      >
        <Download className="w-5 h-5" />
        Install App / APK
      </button>
    </div>
  );
}
