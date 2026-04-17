---
name: yg-api-integration
description: >
  Creating API integrations in Autocare mobile app.
  openapi-fetch + TanStack Query v5 + TypeScript. No Apollo, no GraphQL, no raw fetch.
  Use when adding new API hooks, query/mutation hooks, or data fetching patterns.
allowed-tools: [Bash, Write, Read, Glob]
---

# YG API Integration

## Stack

`openapi-fetch` client wrapped with TanStack Query v5. All API types are auto-generated from OpenAPI specs in `generated/openapi-schema.d.ts`.

## Before You Write Any Code

Read an existing similar domain first:

```
1. Glob: src/api/[closest-domain]/
2. Read queries.ts — copy hook structure, queryKey pattern, fetchClient usage
3. Read query-keys.ts — copy the key factory pattern
4. Check generated/openapi-schema.d.ts for the exact endpoint path string
```

Never invent endpoint paths from memory — use the generated schema.

## File Structure

```
src/api/[domain]/
  queries.ts       ← useQuery hooks
  mutations.ts     ← useMutation hooks (if needed, or keep in queries.ts)
  query-keys.ts    ← hierarchical key factories
  types.ts         ← custom types if needed (usually use generated types)
```

## Query Hook Pattern

```ts
import { useQuery } from '@tanstack/react-query';

import { fetchClient } from '@/api/http-client/http-client';
import { getCacheTimesForQuery } from '@/api/utils/cache';

import { deviceOverviewKeys } from './query-keys';

export const useGetEarnings = (deviceId: string, params?: EarningsParams) =>
  useQuery({
    queryKey: deviceOverviewKeys.earnings(deviceId, params),
    enabled: !!deviceId, // always guard nullable deps
    ...getCacheTimesForQuery(params ?? {}),
    queryFn: async () => {
      const response = await fetchClient().GET(
        '/core-platform/api/deviceoverview/{deviceId}/earnings-v2/{startTime}/{endTime}/{filter}',
        {
          params: {
            path: {
              deviceId,
              startTime: params?.startTime,
              endTime: params?.endTime,
              filter: params?.filter,
            },
          },
        },
      );
      return response.data;
    },
  });
```

## Mutation Hook Pattern

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateDeviceInput) => {
      const res = await fetchClient().PATCH('/core-platform/api/devices', {
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
};
```

## Query Key Factory Pattern

```ts
// src/api/[domain]/query-keys.ts
export const deviceOverviewKeys = {
  all: ['device-overview'] as const,
  device: (id: string) => [...deviceOverviewKeys.all, id] as const,
  earnings: (id: string, params?: EarningsParams) =>
    [...deviceOverviewKeys.device(id), 'earnings', params] as const,
  summary: (id: string) =>
    [...deviceOverviewKeys.device(id), 'summary'] as const,
} as const;
```

## Rules Checklist

- [ ] `enabled: !!dep` — every query with a nullable dependency
- [ ] `fetchClient()` — never raw `fetch()` or axios
- [ ] Hook in `src/api/[domain]/queries.ts` — never inside a component file
- [ ] `invalidateQueries` after mutations that change server state
- [ ] Endpoint path copied from `generated/openapi-schema.d.ts` — never typed from memory
- [ ] `staleTime` set via `getCacheTimesForQuery()` helper
- [ ] Mutations get loading state: `isPending` from `useMutation()`
- [ ] Never handle 401 / token refresh manually — middleware does it
- [ ] Response types from generated schema — never redefine manually

## Common Mistakes

- Forgetting `enabled: !!dep` → query fires with `undefined` params → API error
- Skipping `invalidateQueries` after mutation → stale UI
- Typing endpoint path manually → typo-prone, use the generated types
- Putting query hook inside component → breaks hook rules if component unmounts
