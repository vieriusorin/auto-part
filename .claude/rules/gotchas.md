# Gotchas & Hard-Won Lessons

Consult this before writing code. These are mistakes confirmed in this codebase.

## Forms

- **`Controller`, not `register()`** — all custom inputs must use `Controller`; `register()` only works with native HTML inputs
- **`mode: 'onChange'`** — always; never `'onBlur'` (which is what old wrong rules say)
- **No zodResolver** — Zod is present only for runtime data parsing (SSE schemas); do NOT use it for form validation
- **Manual `rules={{}}`** — inline on each `Controller`, not in a separate `validation.ts` file
- **`form.watch(['field'])`** — always specific fields; bare `form.watch()` re-renders on every keystroke

## TanStack Query

- **`enabled: !!dep`** — whenever a query depends on a nullable value; prevents API errors on `undefined`
- **`invalidateQueries` after mutations** — cache won't update automatically otherwise
- **Never colocate hooks in components** — always in `src/api/[domain]/queries.ts`
- **Wrap tests with `QueryClientProvider`** — with `retry: false, staleTime: Infinity`

## Styling

- **`className` for Tailwind** — not `style={{}}` for static values
- **`style={{}}` only for dynamic values** — computed dimensions, box shadows, animated styles
- **No hex colors in code** — use NativeWind tokens/classes (`text-primary-300`, `bg-background-50`)
- **Check `src/components/ui/`** before reaching for raw primitives directly

## i18n

- **Romanian is the default** (`fallbackLng: 'ro'`) — not English; test with Romanian strings
- **`t()` for every visible string** — hookify blocks hardcoded strings in `.tsx` files
- **Add keys to both locale files** — `en.json` and `ro.json` in `src/locales/metadata/`

## TypeScript

- **`type`, not `interface`** — ESLint enforces this and will fail CI
- **No `any`** — define the type or use `unknown` with a type guard
- **`@/*` alias** — never relative paths going up more than one level

## Navigation

- **`useNavigation()`** from `@react-navigation/native` — not `useNavigate()` (that's React Router)
- **Never `window.location.href`** — this is React Native, not a browser

## Auth & HTTP

- **Never call `fetch()` directly** for API calls — always `fetchClient().GET/POST/...`
- **Token refresh is automatic** via `createAuthMiddleware` — don't handle 401 in components
- **Never read tokens in components** — `AuthService` and the middleware handle everything

## General

- **`console.log`** is blocked by hookify — remove all debug logs before editing
- **No `enum`** — use union types or `const` maps
- **Unused vars** — prefix with `_` (`_error`) to satisfy ESLint without deletion when needed
- **Before writing any new code** — read an existing similar file first; never invent import paths from memory
