import React, { createContext, useContext, useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface OfflineContextType {
  isOnline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({ isOnline: true });

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      setTimeout(() => setShowReconnectedBanner(false), 4000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline }}>
      {children}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-zinc-800 border border-white/10 text-white text-sm px-4 py-2.5 rounded-full shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
          <WifiOff className="w-4 h-4 text-orange-400 shrink-0" />
          <span>You're offline — expenses will sync when reconnected.</span>
        </div>
      )}

      {/* Reconnected Banner */}
      {showReconnectedBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-2.5 rounded-full shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>You're back online — syncing data...</span>
        </div>
      )}
    </OfflineContext.Provider>
  );
};
