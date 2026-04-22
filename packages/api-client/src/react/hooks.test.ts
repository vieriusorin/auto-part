import { beforeEach, describe, expect, it, vi } from 'vitest'

const invalidateQueries = vi.fn()
const useQueryMock = vi.fn()
const useMutationMock = vi.fn()
const getMock = vi.fn()
const postMock = vi.fn()
const putMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => useQueryMock(options),
  useMutation: (options: unknown) => useMutationMock(options),
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('./context.js', () => ({
  useApiClient: () => ({
    GET: getMock,
    POST: postMock,
    PUT: putMock,
  }),
}))

import { queryKeys } from '../query-keys.js'
import {
  useCreateVehicleDocument,
  useCreateVehicleReminder,
  useMarkSubscriptionMonth2Active,
  useUpsertVehicleMember,
  useUpdateVehicleReminder,
  useVehicleDocuments,
  useVehicleMembers,
  useVehicleReminders,
} from './hooks.js'

describe('vehicle reminder hooks', () => {
  beforeEach(() => {
    invalidateQueries.mockClear()
    useQueryMock.mockClear()
    useMutationMock.mockClear()
    getMock.mockReset()
    postMock.mockReset()
    putMock.mockReset()
  })

  it('unwraps list reminder envelope via queryFn', async () => {
    getMock.mockResolvedValue({
      data: { success: true, data: { items: [{ id: 'r1' }] } },
      error: null,
    })
    useQueryMock.mockImplementation((options: { queryFn: () => Promise<unknown> }) => options)

    const result = useVehicleReminders('vehicle-1') as unknown as { queryFn: () => Promise<unknown> }
    const data = await result.queryFn()

    expect(data).toEqual({ items: [{ id: 'r1' }] })
  })

  it('invalidates reminder, action feed, and forecast queries after create', async () => {
    postMock.mockResolvedValue({
      data: { success: true, data: { id: 'r2' } },
      error: null,
    })
    useMutationMock.mockImplementation(
      (options: { mutationFn: (body: unknown) => Promise<unknown>; onSuccess: () => void }) => options,
    )
    const result = useCreateVehicleReminder('vehicle-22') as unknown as {
      mutationFn: (body: unknown) => Promise<unknown>
      onSuccess: () => void
    }
    await result.mutationFn({
      title: 'Oil',
      frequencyType: 'days',
      intervalValue: 90,
    })
    result.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.vehicles.reminders('vehicle-22'),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.vehicles.actionFeed('vehicle-22'),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.vehicles.forecast('vehicle-22'),
    })
  })

  it('invalidates reminder and action feed queries after update', async () => {
    putMock.mockResolvedValue({
      data: { success: true, data: { id: 'r3' } },
      error: null,
    })
    useMutationMock.mockImplementation(
      (options: { mutationFn: (body: unknown) => Promise<unknown>; onSuccess: () => void }) => options,
    )
    const result = useUpdateVehicleReminder('vehicle-44') as unknown as {
      mutationFn: (body: unknown) => Promise<unknown>
      onSuccess: () => void
    }
    await result.mutationFn({ reminderId: 'r3', body: { status: 'deferred' } })
    result.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.vehicles.reminders('vehicle-44'),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.vehicles.actionFeed('vehicle-44'),
    })
  })

  it('unwraps vehicle documents and members envelopes', async () => {
    getMock
      .mockResolvedValueOnce({
        data: { success: true, data: { items: [{ id: 'doc-1' }] } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { items: [{ id: 'mem-1' }] } },
        error: null,
      })
    useQueryMock.mockImplementation((options: { queryFn: () => Promise<unknown> }) => options)

    const docs = useVehicleDocuments('vehicle-90') as unknown as { queryFn: () => Promise<unknown> }
    const members = useVehicleMembers('vehicle-90') as unknown as { queryFn: () => Promise<unknown> }
    expect(await docs.queryFn()).toEqual({ items: [{ id: 'doc-1' }] })
    expect(await members.queryFn()).toEqual({ items: [{ id: 'mem-1' }] })
  })

  it('invalidates documents and members queries after mutations', async () => {
    postMock.mockResolvedValue({
      data: { success: true, data: { id: 'doc-2' } },
      error: null,
    })
    putMock.mockResolvedValue({
      data: { success: true, data: { id: 'mem-2' } },
      error: null,
    })
    useMutationMock.mockImplementation(
      (options: { mutationFn: (body: unknown) => Promise<unknown>; onSuccess: () => void }) => options,
    )

    const createDoc = useCreateVehicleDocument('vehicle-91') as unknown as {
      mutationFn: (body: unknown) => Promise<unknown>
      onSuccess: () => void
    }
    await createDoc.mutationFn({
      type: 'photo',
      title: 'Engine',
      storageKey: 'vehicles/91/doc.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 100,
    })
    createDoc.onSuccess()

    const upsertMember = useUpsertVehicleMember('vehicle-91') as unknown as {
      mutationFn: (body: unknown) => Promise<unknown>
      onSuccess: () => void
    }
    await upsertMember.mutationFn({ userId: 'u-1', role: 'driver' })
    upsertMember.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...queryKeys.vehicles.detail('vehicle-91'), 'documents'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...queryKeys.vehicles.detail('vehicle-91'), 'members'],
    })
  })

  it('invalidates subscription retention summary after marking month2 active', async () => {
    postMock.mockResolvedValue({
      data: { success: true, data: { recorded: true } },
      error: null,
    })
    useMutationMock.mockImplementation(
      (options: { mutationFn: (body: unknown) => Promise<unknown>; onSuccess: () => void }) => options,
    )

    const markMonth2 = useMarkSubscriptionMonth2Active() as unknown as {
      mutationFn: () => Promise<unknown>
      onSuccess: () => void
    }
    await markMonth2.mutationFn()
    markMonth2.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.subscription.retentionSummary(),
    })
  })
})
