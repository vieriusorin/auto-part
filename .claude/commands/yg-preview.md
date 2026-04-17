---
description: Preview a Autocare page in headed Chrome. Pass a route or let Claude auto-detect from recent changes.
allowed-tools: Bash, Read, Glob, Grep
---

# /yg-preview

Open a Autocare page in a **visible Chrome browser** for manual inspection.
Actions are slowed down so you can watch navigation happen in real time.
A screenshot is taken and saved to `.claude/preview-screenshots/`.

**Usage:**

- `/yg-preview /core-platform/vpp` — preview a specific route
- `/yg-preview` — auto-detect route from recent file changes

---

## What I Do When You Run This

### Step 1 — Resolve the Route

**If `$ARGUMENTS` contains a route** (starts with `/`): use it directly.

**If no route given**: auto-detect from recent changes.

```bash
git diff --name-only HEAD
```

- Filter for `.tsx` files under `apps/tenant-ksa/src/app/pages/`
- Take the first match and map it to a route:
  - Strip prefix `apps/tenant-ksa/src/app/pages/`
  - Strip trailing `/index.tsx` or `.tsx`
  - Convert each path segment from camelCase to kebab-case
  - Prepend `/`
  - Example: `pages/corePlatform/vpp/index.tsx` → `/core-platform/vpp`
- If nothing found, use `/` and warn the user

---

### Step 2 — Check Dev Server

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 --max-time 3
```

If the response is not `200`:

- Warn: "Dev server is not running. Start it with: `npx nx serve tenant-ksa`"
- **Stop here** — do not proceed to the preview script.

---

### Step 3 — Ensure Playwright Is Installed

```bash
node -e "require.resolve('playwright')" 2>/dev/null && echo "ok" || echo "missing"
```

If missing:

```bash
npm install --save-dev playwright --legacy-peer-deps 2>&1 | tail -3
npx playwright install chromium --with-deps 2>&1 | tail -5
```

Tell the user if installation ran so they know why there's a delay.

---

### Step 4 — Run the Preview Script

```bash
node scripts/yg-preview.mjs <route> --wait 15
```

The browser will open headed (visible), navigate with slowMo, take a screenshot,
then remain open for **15 seconds** for manual inspection before auto-closing.

Capture stdout. The script prints the screenshot path on a line starting with `Screenshot saved →`.

---

### Step 5 — Report Back

Tell the user:

- **Route opened:** `<resolved-route>`
- **Full URL:** `http://localhost:4200<route>`
- **Screenshot:** `<relative-path>`
- **Browser:** stays open 15s — inspect visually, then auto-closes
- Any errors from the script (Ctrl+C hint if they want to close sooner)

If the page requires Keycloak login (auth redirect), mention:

> "The page redirected to login — that's expected for protected routes. Log in manually in the browser during the 15s window."

---

## Route Mapping Reference

| File path (under `pages/`)       | Route                    |
| -------------------------------- | ------------------------ |
| `corePlatform/vpp/index.tsx`     | `/core-platform/vpp`     |
| `corePlatform/devices/index.tsx` | `/core-platform/devices` |
| `customers/index.tsx`            | `/customers`             |
| `settings/index.tsx`             | `/settings`              |
| `billing/index.tsx`              | `/billing`               |

**Rule:** camelCase path segments → kebab-case, joined by `/`, prefixed with `/`.

---

## Options You Can Pass

| Argument        | Effect                                     |
| --------------- | ------------------------------------------ |
| `/some-route`   | Navigate to this route                     |
| `--wait 30`     | Keep browser open 30s (default: 15)        |
| `--no-wait`     | Close browser immediately after screenshot |
| `--slow-mo 500` | Slower actions (default: 300ms)            |
| `--full-page`   | Full-page screenshot instead of viewport   |
