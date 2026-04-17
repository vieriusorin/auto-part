# TanStack Query — Advanced Patterns

## Optimistic Updates

Use when UX demands instant feedback. The pattern: cancel → snapshot → update → rollback on error → always refetch on settle.

```typescript
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      updateTodo({ id, completed }),

    onMutate: async ({ id, completed }) => {
      // 1. Cancel outgoing refetches (prevent race condition)
      await queryClient.cancelQueries({ queryKey: todoQueries.detail(id).queryKey });

      // 2. Snapshot for rollback
      const previousTodo = queryClient.getQueryData(todoQueries.detail(id).queryKey);

      // 3. Optimistically update cache
      queryClient.setQueryData(todoQueries.detail(id).queryKey, (old) =>
        old ? { ...old, completed } : old
      );

      return { previousTodo };
    },

    onError: (_error, { id }, context) => {
      // Rollback to snapshot
      if (context?.previousTodo) {
        queryClient.setQueryData(todoQueries.detail(id).queryKey, context.previousTodo);
      }
    },

    onSettled: (_data, _error, { id }) => {
      // Always refetch to ensure cache matches server
      queryClient.invalidateQueries({ queryKey: todoQueries.detail(id).queryKey });
      queryClient.invalidateQueries({ queryKey: todoQueries.lists() });
    },
  });
}
```

---

## QueryClient Configuration

```typescript
// src/lib/query-client.ts
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,            // 1 minute fresh window
        gcTime: 1000 * 60 * 5,           // 5 minutes in cache after unmount
        retry: 2,
        refetchOnWindowFocus: process.env.NODE_ENV === "production",
      },
      mutations: {
        retry: 0,  // Mutations are not idempotent
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only toast for background refetch errors (data already exists)
        if (query.state.data !== undefined) {
          toast.error(`Background update failed: ${error.message}`);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(`Operation failed: ${error.message}`);
      },
    }),
  });
}
```

---

## QueryProvider Setup

```typescript
// src/providers/QueryProvider.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "@/lib/query-client";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures a single QueryClient instance per app lifecycle
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Error Boundaries with useSuspenseQuery

```typescript
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

function TodoPage() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={ErrorFallback}>
          <Suspense fallback={<Skeleton />}>
            <TodoList />  {/* Uses useSuspenseQuery — data always defined */}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

---

## Testing Utilities

```typescript
// test-utils.ts
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,      // Don't retry in tests — fail fast
        gcTime: Infinity,  // Don't garbage collect during test runs
      },
    },
  });
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Usage in tests (with @testing-library/react):
// const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });
```
