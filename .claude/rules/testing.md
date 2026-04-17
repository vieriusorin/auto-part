# Testing

Stack: **Jest + @testing-library/react-native**. Tests colocate in `__tests__/` beside the file under test.

## Setup Pattern

All component/screen tests need `QueryClientProvider`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

describe('MyComponent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
  });

  test('renders correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('my-component')).toBeTruthy();
  });
});
```

## Mocking API Hooks

Mock at the **hook level**, not at the fetch level:

```tsx
jest.mock('@/api/plants/queries', () => ({
  useGetPlants: () => ({
    data: [{ id: '1', plantName: 'Test Plant' }],
    isLoading: false,
    error: null,
  }),
}));
```

## Rules

- `describe` / `test` / `expect` — Arrange-Act-Assert; never nest `describe` blocks
- `beforeEach` / `afterEach` for setup and teardown
- `getByTestId` — primary query method (most tests use this); `getByRole` for accessibility-sensitive tests; `getByText` only as last resort
- `@faker-js/faker` for all test data — no hardcoded strings or IDs; define as local `const` at top of test
- TypeScript for all test files
- E2E with Detox only when explicitly requested, using Page Object Model pattern

## Hook Tests

For testing custom hooks, use `renderHook` from `@testing-library/react-native`:

```tsx
import { renderHook } from '@testing-library/react-native';

test('returns formatted value', () => {
  const { result } = renderHook(() => useMyHook(input));
  expect(result.current).toBe(expectedOutput);
});
```
