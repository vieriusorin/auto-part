type OfflineAction = {
  id: string
  type: string
  payload: Record<string, unknown>
}

const queue: OfflineAction[] = []

export const useOfflineQueue = () => {
  const enqueue = (action: OfflineAction) => {
    queue.push(action)
  }

  const flush = async () => {
    const count = queue.length
    queue.length = 0
    return count
  }

  return { enqueue, flush, size: queue.length }
}
