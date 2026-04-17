# Autocare Mobile App — Stack Reference

> **This file is the canonical truth.** On any conflict with memory files, docs, or
> outdated instructions — this file wins. Updated: 2026-04-07.

---

## What this project IS and IS NOT

| IS                                  | IS NOT                     |
| ----------------------------------- | -------------------------- |
| React Native 0.79 + Expo 53         | Next.js / web app          |
| Expo managed workflow               | Bare React Native          |
| NativeWind (Tailwind-style RN)      | MUI / shadcn / Chakra      |
| TanStack Query v5 + openapi-fetch   | Apollo / GraphQL           |
| React Hook Form + manual validation | Zod forms / Yup            |
| Zustand for global state            | Redux / MobX               |
| React Navigation v7                 | React Router / Expo Router |

**Never write:** `'use client'`, MUI imports, Apollo, `useNavigate()` from react-router-dom,
`@fd-tenant/api`, `apiClient`, `yup`, Nx monorepo commands.

---

## Stack Decisions (authoritative)

### Forms

- **Library:** React Hook Form v7 + `Controller` (never `register()` on custom inputs)
- **Validation:** manual `rules={{}}` on each `Controller` — no schema library
- **`mode: 'onChange'`** always in `useForm()` — never `'onBlur'` or `'onSubmit'`
- **Zod** — used only for runtime data parsing (e.g. SSE schema validation), NOT for forms
- Form type defined inline: `type LoginFormData = { ... }`

### UI Components (priority order)

1. `src/components/ui/*` — project shared UI primitives (check here first)
2. `src/components/common/*` — shared cross-feature components
3. React Native core primitives when no shared wrapper exists
4. NativeWind className — Tailwind utilities for layout/spacing
5. `style={{}}` — only for truly dynamic/computed values (box shadows, calculated dimensions)

**NOT:** MUI, PrimeReact, Radix, styled-components — none exist here.

### Styling

- `className` prop with Tailwind utilities via NativeWind
- NativeWind theme tokens/classes — no hardcoded hex colors (use `text-primary-300`, `bg-background-50`)
- `style={{}}` only when Tailwind can't express it (computed values, box shadows)

### Internationalization

- **i18next v25 + react-i18next**
- `const { t } = useTranslation()` (some files use `translate` as alias — both are fine)
- Default/fallback language: **Romanian (`ro`)**, not English
- Translation files: `src/locales/metadata/en.json` and `src/locales/metadata/ro.json`
- Every user-visible string must use `t('key')` — hookify blocks hardcoded strings

### Data Fetching

- **TanStack Query v5** wrapping `openapi-fetch` client
- Client singleton via `fetchClient()` from `src/api/http-client/http-client.ts`
- Auth handled by middleware — adds `Bearer` token + `X-ApiKey` automatically
- Hook location: `src/api/[domain]/queries.ts` or `mutations.ts`
- Query key factories: `src/api/[domain]/query-keys.ts`
- Query keys: hierarchical factory `['domain', id, params]`
- Guard nullable deps: `enabled: !!id`

### State Management

- **Zustand** for global app state (auth, user, dashboard, modals)
- `persist` middleware with `AsyncStorage` for durable state
- `partialize` to control exactly what gets persisted
- Export derived selector hooks alongside the store

### Navigation

- React Navigation v7 (native-stack + bottom-tabs)
- Typed param lists per stack in `src/navigation/types.d.ts`
- Global namespace augmentation: `declare global { namespace ReactNavigation { ... } }`
- Multiple stacks gated by auth state: `LoggedOutStack` / `OnboardingStack` / `LoggedInStack`

### Authentication

- JWT access token + refresh token stored via Expo Secure Store / `AuthService`
- Auto token refresh with request queuing in `createAuthMiddleware`
- Never handle auth token manually in components — middleware does it

---

## Path Aliases (tsconfig.json — always use these)

```
@/*  →  ./src/*
```

Never use relative paths that go up more than one level within `src/`.

---

## Coding Style (non-negotiable)

- `type` over `interface` — ESLint-enforced (`consistent-type-definitions: ['error', 'type']`)
- No `any` — use specific types or `unknown`
- Avoid enums — use `const` maps or union types
- Unused params/vars: prefix with `_` (ESLint allows `_` prefix pattern)
- Optional chaining always on query data: `data?.items?.map()`
- Async: `async/await` + `try/catch`, never `.then()/.catch()`
- PascalCase for components and their files/folders
- kebab-case for all other files and non-component folders

---

## Anti-patterns (never generate)

| Anti-pattern                                     | Correct alternative                               |
| ------------------------------------------------ | ------------------------------------------------- |
| `import * as yup from 'yup'`                     | Manual `rules={{}}` on Controller                 |
| `zodResolver(schema)` in `useForm()`             | Manual `rules={{}}` on Controller                 |
| `register()` on custom inputs                    | `Controller` from react-hook-form                 |
| `mode: 'onBlur'` in `useForm()`                  | `mode: 'onChange'`                                |
| `import { useNavigate } from 'react-router-dom'` | `useNavigation()` from `@react-navigation/native` |
| `import apolloClient` / `useQuery` from Apollo   | TanStack Query + `fetchClient()`                  |
| Hardcoded English text in JSX                    | `{t('section.key')}`                              |
| Hardcoded hex color `#1A2B3C`                    | Tailwind token `text-primary-300`                 |
| `interface Foo {}`                               | `type Foo = {}`                                   |
| `console.log(...)`                               | Remove (hookify blocks it)                        |
| `enum Direction {}`                              | `type Direction = 'left' \| 'right'`              |
| `fetch(url)` for API calls                       | `fetchClient().GET(...)`                          |
