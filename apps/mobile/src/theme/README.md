# Mobile Theming System

## Goal

Keep UI scalable by using centralized design tokens instead of per-screen values.

## Structure

- `themes.ts`
  - **Core palette**: `primary`, `secondary`, `accent`, `success`, `warning`, `error`, neutrals
  - **Semantic colors**: surfaces, text, button, feedback, border, tab roles
  - **Spacing scale**: `xxs` -> `xxl`
  - **Radius scale**: `sm` -> `pill`
  - **Typography**: hierarchy sizes (`h1`, `h2`, `body`, `caption`), weights, line heights
- `theme-context.tsx`
  - Supports `light`, `dark`, `system`
  - Resolves system theme from device color scheme

## Usage rule

Do not hardcode one-off style values in screens. Use `useAppTheme()` and map styles from:

- `theme.colors.*`
- `theme.spacing.*`
- `theme.radius.*`
- `theme.typography.*`

## Scaling guidance

When adding new functionality:

1. Add new **semantic tokens** first (not raw hex values in screens).
2. Reuse existing spacing/radius/type scales.
3. Keep component styles role-based (`surfacePrimary`, `textSecondary`, etc.).
4. Reserve palette updates for branding shifts and broad visual changes.
