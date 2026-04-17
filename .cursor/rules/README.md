# Cursor Rules for Autocare

This folder mirrors the core project guidance currently defined under `.claude`.

## Rule files

- `Autocare-stack.mdc` — always-on canonical stack and anti-pattern guardrails
- `react-native-architecture.mdc` — screen/component/navigation architecture
- `api-standards.mdc` — TanStack Query + openapi-fetch API conventions
- `forms.mdc` — React Hook Form + Controller standards
- `styling-i18n.mdc` — NativeWind-first styling and localization requirements

## Maintenance

- When `.claude/STACK.md` or `.claude/rules/*` changes, keep these `.cursor/rules/*.mdc` files in sync.
- Prefer updating shared principles in `Autocare-stack.mdc` first, then more specific scoped rule files.
