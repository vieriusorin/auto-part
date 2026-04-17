# React Native & Component Patterns

## This is a React Native + Expo app

No web framework, no Next.js, no `'use client'`, no `page.tsx`. Uses Expo managed workflow.

## Component File Structure

Every component lives in its own folder with an index re-export:

```
src/components/MyComponent/
  MyComponent.tsx    ← component definition
  index.tsx          ← re-export: export { MyComponent } from './MyComponent'
```

Group related sub-components in the same folder:

```
src/components/wallet/WalletCard/
  WalletCard.tsx
  WalletCardHeader.tsx     ← sub-component, not exported from index
  index.tsx
```

Split any component exceeding ~200 lines into sub-components.

## Directory Placement

| What                            | Where                              |
| ------------------------------- | ---------------------------------- |
| Shared UI primitives            | `src/components/ui/`               |
| Shared across features (atomic) | `src/components/common/`           |
| Feature-specific                | `src/components/[feature-domain]/` |
| Screen root components          | `src/screens/[ScreenName]/`        |
| Custom hooks                    | `src/hooks/`                       |
| Global state                    | `src/store/`                       |
| Utilities / pure functions      | `src/utils/`                       |
| API hooks + types               | `src/api/[domain]/`                |
| App-wide constants              | `src/constants/`                   |

## Naming

- **PascalCase** — component files, component folders, component names (`UserProfile.tsx`, `src/screens/Dashboard/`)
- **kebab-case** — all other files and non-component folders (`user-profile.ts`, `src/store/auth-store.ts`)
- **camelCase** — variables and functions
- **PascalCase for constant objects** — `const Config = { MaxRetries: 3 }`, not `MAX_RETRIES`

## Screen Pattern

```tsx
const Dashboard = () => {
  // 1. Store selectors
  const { selectedPlantId } = useDashboardStore();

  // 2. Query hooks
  const { data: plants, refetch } = useGetPlants({ customerId });

  // 3. Derived state with useMemo
  const selectedPlant = useMemo(() => plants?.find(...) ?? plants?.[0], [plants, selectedPlantId]);

  // 4. Screen lifecycle
  useFocusEffect(useMemo(() => () => { void refetch(); }, [refetch]));

  // 5. Pull-to-refresh via useRefreshState
  const { refreshing, onRefresh } = useRefreshState([refetch]);

  return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />;
};
```

## Performance

- `FlatList` / `SectionList` for lists — never `ScrollView` over a `.map()`
- `useMemo` for expensive derivations from query data
- `useCallback` for stable function references passed as props
- Don't overuse — only where re-renders are measurable

## Platform

- `Platform.select()` for small differences
- `.ios.tsx` / `.android.tsx` files for divergent platform code
- Always handle safe areas with `react-native-safe-area-context`

## State per Layer

| Data                  | Tool                                 |
| --------------------- | ------------------------------------ |
| Server data           | TanStack Query (source of truth)     |
| Global app/UI state   | Zustand                              |
| Component-local UI    | `useState`                           |
| Multi-step form state | `useForm` context via `FormProvider` |

## TypeScript in Components

- Always type props: `type Props = { ... }`
- Optional chaining on all query data: `data?.items?.map()`
- Never `any` — use `unknown` and narrow with type guards
