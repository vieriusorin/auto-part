# API Standards

## Stack

TanStack Query v5 + `openapi-fetch`. No Apollo, no GraphQL, no raw `fetch` for API calls.

## HTTP Client

Singleton via `fetchClient()` from `src/api/http-client/http-client.ts`. Auth middleware is already attached — never add headers manually in components.

```ts
import { fetchClient } from '@/api/http-client/http-client';

const response = await fetchClient().GET('/core-platform/api/devices/{id}', {
  params: { path: { id: deviceId } },
});
return response.data;
```

## Query Hook Pattern

Hooks live in `src/api/[domain]/queries.ts`:

```ts
export const useGetEarnings = (deviceId: string, params?: EarningsParams) =>
  useQuery({
    queryKey: deviceOverviewKeys.earnings(deviceId, params),
    enabled: !!deviceId,                          // always guard nullable deps
    ...getCacheTimesForQuery(params ?? {}),
    queryFn: async () => {
      const response = await fetchClient().GET('/core-platform/api/...', {
        params: { path: { deviceId, ... } },
      });
      return response.data;
    },
  });
```

## Mutation Hook Pattern

Mutations live in `src/api/[domain]/mutations.ts` (or `queries.ts` for small domains):

```ts
export const useLoginUser = () =>
  useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await fetchClient().POST(
        '/platform-authentication/.../login',
        { body: input },
      );
      // transform/parse response
      return res.data;
    },
  });
```

After mutations that change server data, call `queryClient.invalidateQueries(...)`.

## Query Key Factories

Query keys live in `src/api/[domain]/query-keys.ts`. Always use hierarchical factories:

```ts
export const deviceOverviewKeys = {
  all: ['device-overview'] as const,
  device: (id: string) => [...deviceOverviewKeys.all, id] as const,
  earnings: (id: string, params?: EarningsParams) =>
    [...deviceOverviewKeys.device(id), 'earnings', params] as const,
} as const;
```

## Rules

- `enabled: !!dep` — always guard queries with nullable dependencies
- Never colocate query hooks inside component files
- Never import `fetchClient` inside a component — put it in the hook
- No raw `fetch()` — always use `fetchClient()`
- Token refresh is handled automatically by `createAuthMiddleware` — never handle it manually
- Generated OpenAPI types live in `generated/openapi-schema.d.ts` — never redefine manually
- Run `pnpm generate:openapi-types` after backend schema changes
