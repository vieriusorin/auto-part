---
name: yg-debugger
description: >
  Debugging Autocare React Native / Expo app — TypeScript errors, TanStack Query issues,
  NativeWind styling problems, navigation errors, Expo build issues, platform differences.
allowed-tools: [Bash, Read, Glob, Grep]
---

# YG Debugger

## Diagnostic Approach

1. Read the error message fully — don't guess
2. Search for the exact symbol/file mentioned: `Grep pattern src/`
3. Read the file at the line number given
4. Check a working similar implementation for comparison
5. Run `pnpm type-check` to surface all TS errors at once

---

## TypeScript Errors

**`Type 'interface' is not assignable...` / `consistent-type-definitions`**
→ Changed `interface Foo {}` to `type Foo = {}` — ESLint enforces `type` only.

**`Cannot find module '@/...'`**
→ Path alias `@/*` maps to `./src/*`. Check `tsconfig.json`.
→ Metro might need restart: kill metro, run `pnpm start` fresh.

**`Property X does not exist on type`**
→ Use optional chaining: `data?.property`. Query data is `undefined` until loaded.

**`Type 'any'`**
→ Never use `any`. Define the type or use `unknown` + type guard.

---

## TanStack Query

**Query never fires / data always `undefined`**
→ Check `enabled`: if `enabled: !!dep` and `dep` is `undefined`, the query is disabled.
→ Add `console.log(dep)` temporarily to confirm (remove after — hookify will block it).

**Data stale after mutation**
→ Missing `queryClient.invalidateQueries()` in `onSuccess`.
→ Check the query key used in `invalidateQueries` matches the key used in `useQuery`.

**Query fires but returns error**
→ Check endpoint path matches `generated/openapi-schema.d.ts` exactly.
→ Check required path/query params are all provided and not `undefined`.

**Infinite refetch loop**
→ `queryFn` has an unstable reference. Move it outside the component or use `useCallback`.

---

## NativeWind / Styling

**`className` not applying**
→ NativeWind requires `global.css` to be imported in the entry (check `App.tsx`).
→ Tailwind class must exist in the config — no arbitrary values like `p-[13px]` unless in the config.
→ Ensure NativeWind is configured and app entry loads global styles correctly.

**Component colors look wrong**
→ Use semantic token classes (`text-primary-300`) — hex colors bypass the theme.
→ Check theme/token config is loaded in NativeWind setup.

**Styles look different on iOS vs Android**
→ iOS: font weight renders differently, borderRadius clips differently.
→ Android: elevation replaces box shadows; `boxShadow` CSS prop doesn't work.
→ Use `Platform.select()` for divergent values.

---

## Navigation

**`useNavigation()` throws outside navigator**
→ Component is rendered outside the NavigationContainer tree.
→ Check it's inside a Stack/Tab navigator.

**Wrong screen params type**
→ Check `src/navigation/types.d.ts` — param types must be declared there.
→ Route param not found at runtime → check `route.params?.field` with optional chaining.

**Android back button does nothing**
→ Add `useBackHandler` or `useFocusEffect` to handle the hardware back event.

---

## Forms

**Controller `onChange` not updating field**
→ Custom input must call the `onChange` callback from `field`. Check that `field.onChange` is being called.

**`isValid` is `false` even though fields look correct**
→ `mode: 'onChange'` requires user interaction to trigger validation. Check `defaultValues` match the type.
→ Run `console.log(errors)` temporarily to see which fields are invalid.

**Form not re-rendering after mutation error**
→ Mutation errors are separate from form errors. Use `useToast()` or local state to show API errors.

---

## Expo / Metro

**Metro bundler fails to start**
→ Run `pnpm start --clear` to clear Metro cache.
→ Delete `.expo/` folder and restart.

**`pnpm install` breaks native modules**
→ Run `pnpm expo install` for native packages — ensures compatible versions.
→ After native changes, full rebuild required: `pnpm android` / `pnpm ios`.

**Environment variable not available at runtime**
→ Expo env vars must be prefixed `EXPO_PUBLIC_` to be available in client code.
→ Check `src/constants/env.ts` for how vars are accessed.

**OpenAPI types out of date**
→ Run `pnpm generate:openapi-types` after backend schema changes.

---

## Trigger Phrases

- "debug this error"
- "why is this query not working"
- "typescript error in..."
- "styles not applying"
- "navigation throwing"
- "form not working"
