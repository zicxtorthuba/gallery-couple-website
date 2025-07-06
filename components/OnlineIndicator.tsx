"use client";
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

export default function OnlineIndicator() {
  const online = useOnlineUsers();
  if (online === 0) return null; // don't show until we know

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 select-none">
      <div className="bg-white/90 dark:bg-black/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-2 rounded-lg text-sm font-medium">
        Đang online: <span className="text-emerald-600 font-semibold">{online}</span>
      </div>
    </div>
  );
}
