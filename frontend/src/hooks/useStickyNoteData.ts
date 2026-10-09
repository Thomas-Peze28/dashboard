import { useEffect, useState } from 'react'
import { fetchStickyNoteData } from '../api/stickyNotes'

// Charge les données d'un widget puis les rafraîchit régulièrement.
// error contient le message du backend ; les données déjà chargées sont conservées si un rafraîchissement échoue.
export function useStickyNoteData<T>(noteId: string, refreshDelay: number) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    const load = async () => {
      try {
        const loaded = await fetchStickyNoteData<T>(noteId)

        if (isCancelled) return

        setData(loaded)
        setError(null)
      } catch (loadError) {
        if (!isCancelled) setError(loadError instanceof Error ? loadError.message : '')
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), refreshDelay)

    return () => {
      isCancelled = true
      window.clearInterval(interval)
    }
  }, [noteId, refreshDelay])

  return { data, error }
}
