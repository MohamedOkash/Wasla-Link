import React, { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
    };

    checkStatus();

    const listener = Network.addListener('networkStatusChange', status => {
      setIsOffline(!status.connected);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] bg-red-600 text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 animate-fade-in shadow-lg">
      <WifiOff size={16} />
      <span>أنت غير متصل بالإنترنت حالياً (Offline)</span>
    </div>
  );
};
