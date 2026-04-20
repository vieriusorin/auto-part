import { useSyncActions } from '@autocare/api-client/react'
import { useRef } from 'react'

type OfflineAction = {
  id: string
  type: string
  payload: Record<string, unknown>
}

export const useOfflineQueue = () => {
  const queueRef = useRef<OfflineAction[]>([])
  const syncMutation = useSyncActions()

  const enqueue = (action: OfflineAction) => {
    queueRef.current.push(action)
  }

  const flush = async (): Promise<number> => {
    const actions = [...queueRef.current]
    if (actions.length === 0) {
      return 0
    }

    try {
      const result = await syncMutation.mutateAsync({ actions })
      queueRef.current = []
      return result.synced ?? actions.length
    } catch {
      return 0
    }
  }

  return {
    enqueue,
    flush,
    get size() {
      return queueRef.current.length
    },
    isSyncing: syncMutation.isPending,
  }
}
