import React from 'react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { Wifi, WifiOff, CloudLightning } from 'lucide-react'

export default function OfflineIndicator() {
  const { isOnline, pendingCount } = useOnlineStatus()

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border border-rose-100/60 dark:border-rose-900/30 text-xs font-bold shadow-sm animate-pulse">
        <WifiOff className="h-4 w-4 text-rose-500" />
        <span>Sin conexión</span>
        {pendingCount > 0 && (
          <span className="ml-1 px-2 py-0.5 text-[10px] bg-rose-600 text-white rounded-full font-extrabold flex items-center justify-center animate-bounce">
            {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
          </span>
        )}
      </div>
    )
  }

  // If online but there are still items syncing
  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-100/60 dark:border-amber-900/30 text-xs font-bold shadow-sm">
        <CloudLightning className="h-4 w-4 text-amber-500 animate-spin" />
        <span>Sincronizando...</span>
        <span className="ml-1 px-2 py-0.5 text-[10px] bg-amber-550 text-white rounded-full font-extrabold">
          {pendingCount}
        </span>
      </div>
    )
  }

  // If online and fully synced
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100/40 dark:border-emerald-900/20 text-xs font-semibold transition-all duration-300">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Wifi className="h-3.5 w-3.5 opacity-80" />
      <span className="hidden md:inline">En línea</span>
    </div>
  )
}
