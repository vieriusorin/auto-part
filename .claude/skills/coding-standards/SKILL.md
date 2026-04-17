---
name: coding-standards
description: >
  Coding standards and patterns for Autocare React Native + TypeScript app.
  Use when reviewing code quality, naming conventions, or checking best practices.
triggers:
  - 'coding standards'
  - 'best practices'
  - 'code quality guidelines'
allowed-tools: [Read, Write, Edit, Bash]
---

# Coding Standards — React Native + TypeScript

For detailed patterns with examples: read `references/full-guide.md`

---

## Naming

- [ ] Components and their files/folders: `PascalCase` (`UserProfile.tsx`, `src/screens/Dashboard/`)
- [ ] Non-component files and folders: `kebab-case` (`auth-store.ts`, `date-utils.ts`)
- [ ] Variables and functions: `camelCase`
- [ ] Constant objects: `PascalCase` keys (`const Config = { MaxRetries: 3 }`)
- [ ] Hooks: `useCamelCase`
- [ ] Types: `PascalCase`, defined with `type` (ESLint enforces — never `interface`)

## TypeScript

- [ ] `type` not `interface` — ESLint will error on `interface`
- [ ] No `any` — use specific type or `unknown` + type guard
- [ ] No `enum` — use union types or `const` maps
- [ ] `import type` for type-only imports
- [ ] Unused params: prefix with `_` (`_error`, `_ref`)
- [ ] Optional chaining on query/API data: `data?.items?.map()`
- [ ] Path alias `@/*` — never relative paths going up more than one level

## Immutability & Functions

- [ ] Never mutate state directly — use spread `{ ...obj, key: value }` or Immer
- [ ] State updates via functional form when depending on previous value
- [ ] `async/await` + `try/catch` — never `.then()/.catch()` chains

## React Native Specifics

- [ ] `FlatList` / `SectionList` for lists — never `ScrollView` over `.map()`
- [ ] `useCallback` for stable function references passed as props
- [ ] `useMemo` for expensive derivations from query data
- [ ] Don't overuse memo — only where re-renders are measurable
- [ ] `Platform.select()` for small platform differences
- [ ] `.ios.tsx` / `.android.tsx` for divergent platform code (>5 lines difference)
- [ ] Always handle safe areas with `react-native-safe-area-context`

## Styling

- [ ] `className` for static Tailwind values
- [ ] `style={{}}` only for dynamic/computed values (box shadow, calculated width)
- [ ] No hardcoded hex colors — use NativeWind token classes (`text-primary-300`)
- [ ] No `StyleSheet.create()` for static styles — use NativeWind instead

## Components

- [ ] One component per file
- [ ] Props typed with `type` (not `interface`)
- [ ] Early returns for conditional rendering — avoid deep nesting
- [ ] Render helpers (`renderHeader()`) for complex JSX sub-sections
- [ ] No `setState` passed to children — use callback props (`onSelect`, `onChange`)
- [ ] Keep components under ~200 lines — split if longer

## Code Hygiene (before every commit)

- [ ] No `console.log` debug statements (hookify blocks them)
- [ ] No commented-out code
- [ ] No unused imports or variables
- [ ] No hardcoded visible strings (hookify blocks them)

## Error Handling

- [ ] All async functions have `try/catch`
- [ ] API errors shown via `useToast()` — not `alert()` or `console.error()`
- [ ] Loading + error states always handled together on data-driven screens
