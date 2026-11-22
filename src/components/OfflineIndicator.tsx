import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-white border-2 border-[#FA6806] px-4 py-2.5 text-xs font-semibold text-[#0F2942] shadow-md"
    >
      <WifiOff size={15} className="text-[#FA6806] shrink-0" />
      <span>Offline Mode — QR scanner &amp; 20 authorized labels available locally; live sync paused.</span>
    </div>
  );
};
