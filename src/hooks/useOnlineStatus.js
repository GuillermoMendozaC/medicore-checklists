import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'

/**
 * Custom hook to reactively track browser connection status
 * and count of completed checklists pending synchronization in IndexedDB.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Live query to track Dexie pending_checklists size
  // It only counts completed checklists waiting to sync
  const pendingCount = useLiveQuery(
    async () => {
      try {
        return await db.pending_checklists
          .where('status')
          .equals('completado')
          .count()
      } catch (err) {
        console.error("Error counting pending checklists:", err)
        return 0
      }
    },
    []
  ) ?? 0

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    pendingCount
  }
}
