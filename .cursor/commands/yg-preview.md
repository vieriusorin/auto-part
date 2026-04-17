---
description: Preview a Autocare route in headed Chrome and capture a screenshot.
---

# /yg-preview

Open a Autocare page in visible Chrome for manual inspection and save a screenshot.

## Usage

- `/yg-preview /core-platform/vpp`
- `/yg-preview` (auto-detect from recent route-related changes)

## Execution contract

1. Resolve route from args or recent changed page file.
2. Verify dev server health at `http://localhost:4200`.
3. Ensure Playwright is installed.
4. Run:
   - `node scripts/yg-preview.mjs <route> --wait 15`
5. Return:
   - route opened
   - full URL
   - screenshot path
   - key errors (if any)

If redirected to auth, report that login is expected for protected routes.
