---
name: tanstack-query
description: >
  TanStack Query (React Query v5) patterns for Autocare mobile app.
  openapi-fetch client. Use when writing useQuery, useMutation, cache invalidation,
  query key factories, or any server state management.
  Triggers: "how do I fetch data", "useQuery hook", "cache after mutation", "invalidate queries".
allowed-tools: [Read]
---

# TanStack Query v5 — Autocare Mobile

For detailed API reference: read `references/full-guide.md`

---

## Hook Locations (this project)

```
src/api/[domain]/queries.ts     ← useQuery + useMutation hooks
src/api/[domain]/query-keys.ts  ← hierarchical key factories
src/api/[domain]/mutations.ts   ← (optional split for large domains)
```

Never colocate query hooks in component files.

---

## Key Rules Checklist

- [ ] `fetchClient()` from `@/api/http-client/http-client` — never raw `fetch`
- [ ] `enabled: !!dep` when query depends on a nullable value
- [ ] Query key: use factory from `query-keys.ts` — never ad-hoc strings
- [ ] `staleTime` via `getCacheTimesForQuery()` helper
- [ ] `invalidateQueries` after every mutation that changes server data
- [ ] Token refresh automatic via middleware — never handle 401 in components
- [ ] `skipToken` as alternative to `enabled: false` for type-safe disabling

---

## Query Pattern

```ts
export const useGetSummary = (deviceId: string) =>
  useQuery({
    queryKey: deviceOverviewKeys.summary(deviceId),
    enabled: !!deviceId,
    ...getCacheTimesForQuery({}),
    queryFn: async () => {
      const response = await fetchClient().GET(
        '/core-platform/api/deviceoverview/{deviceId}/summary-v2',
        { params: { path: { deviceId } } },
      );
      return response.data;
    },
  });
```

## Mutation Pattern

```ts
export const useUpdatePlant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdatePlantInput) => {
      const res = await fetchClient().PUT('/customers/api/plants/plant', {
        body: input,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: plantKeys.plant(variables.plantId),
      });
    },
  });
};
```

## Query Key Factory Pattern

```ts
export const deviceOverviewKeys = {
  all: ['device-overview'] as const,
  device: (id: string) => [...deviceOverviewKeys.all, id] as const,
  earnings: (id: string, params?: EarningsParams) =>
    [...deviceOverviewKeys.device(id), 'earnings', params] as const,
} as const;
```

Hierarchical keys enable scoped invalidation:

- `invalidateQueries({ queryKey: deviceOverviewKeys.all })` — invalidates everything for the domain
- `invalidateQueries({ queryKey: deviceOverviewKeys.device(id) })` — only that device

---

## Common Mistakes

| Mistake                               | Fix                                                  |
| ------------------------------------- | ---------------------------------------------------- |
| `enabled: !!dep` omitted              | Query fires with `undefined` → API 400 error         |
| Bare `enabled: false`                 | Disables permanently — use `enabled: !!dep`          |
| No `invalidateQueries` after mutation | UI stays stale                                       |
| Inline query key string               | Hard to invalidate — use key factory                 |
| Query hook inside component           | Breaks on unmount — move to `queries.ts`             |
| `form.watch()` without fields         | Re-renders every keystroke — `form.watch(['field'])` |

---

## Test Setup

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

render(
  <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>,
);
```

Mock at the hook level:

```ts
jest.mock('@/api/plants/queries', () => ({
  useGetPlants: () => ({ data: mockPlants, isLoading: false }),
}));
```
