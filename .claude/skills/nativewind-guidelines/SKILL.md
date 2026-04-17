---
name: nativewind-guidelines
description: >
  NativeWind styling standards for React Native apps. Enforces token-first styling,
  component reuse, performance-safe class composition, accessibility-ready patterns,
  and maintainable UI conventions for team-wide consistency.
triggers:
  - 'nativewind'
  - 'tailwind react native'
  - 'style this screen'
  - 'refactor styles'
  - 'ui consistency'
allowed-tools: [Read, Write, Edit, Glob]
---

# NativeWind Guidelines

Use this skill when creating, reviewing, or refactoring React Native UI styled with NativeWind.

Primary goals:
- consistent design language
- predictable and maintainable class usage
- high performance on low-end devices
- accessibility-ready components

---

## Stack Context

- React Native + Expo
- NativeWind-first styling
- Shared primitives preferred from `src/components/ui/*` and `src/components/common/*`
- i18n required for user-visible text

---

## Core Styling Rules

1. **Use `className` for static styling**
   - Prefer utility classes for layout, spacing, typography, borders, and colors.
2. **Use `style` only for computed/dynamic values**
   - Examples: runtime dimensions, animation transforms, progress-based values.
3. **Token-first colors and spacing**
   - No hardcoded hex colors when design tokens/classes exist.
4. **Prefer shared wrappers before raw primitives**
   - Reuse existing `ui`/`common` components to avoid style drift.
5. **Keep class composition simple**
   - Avoid deeply nested template strings and excessive runtime concatenation.

---

## Architecture and Reuse

- Create reusable style maps for variants/sizes/states.
- Prefer `type` aliases and union variants over ad-hoc strings.
- Keep variant maps outside component bodies when static.
- For complex style logic, use small helper functions with early returns.

Example pattern:

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'outline';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
  outline: 'border border-primary-500 text-primary-500 bg-transparent',
};
```

---

## Performance Rules

- Avoid creating large class strings inline repeatedly in render.
- Use deterministic class helpers for state variants.
- Prefer `FlatList`/`SectionList` for long lists (not `ScrollView` + `.map()`).
- Keep components small and split large style-heavy blocks.
- Avoid unnecessary rerenders from unstable props/functions in styled trees.

---

## Accessibility and UX Rules

- Ensure interactive components expose correct accessibility role/label/hint.
- Maintain adequate touch target sizes on tappable elements.
- Preserve text readability and contrast with token-based palettes.
- Keep semantic hierarchy in typography (title/subtitle/body patterns).

---

## i18n and Content Rules

- No hardcoded user-visible strings in JSX.
- Use `t('namespace.key')` for visible content.
- If adding new text, ensure translation keys exist in both language files.

---

## Anti-patterns (Reject in Review)

- hardcoded hex colors for standard UI colors
- repeated inline class concatenation with complex conditionals
- creating duplicate visual primitives instead of reusing shared ones
- using `style` for static values already expressible via class utilities
- mixed naming conventions for variants and sizes

---

## NativeWind Review Checklist

- [ ] Shared UI wrappers were considered first
- [ ] `className` used for static styles
- [ ] `style` used only for dynamic/computed values
- [ ] No hardcoded hex colors (unless explicitly justified)
- [ ] Variant/size/state styles mapped consistently
- [ ] Long lists use `FlatList`/`SectionList`
- [ ] User-visible strings use i18n keys
- [ ] Accessibility props covered for interactive elements

---

## Sources

- [Best Practices for Styling in React Native with NativeWind and Styled Components](https://huyha.zone/blog/post/styling-react-native-nativewind-styled-components/)
- [React Native best practices 2026](https://shyft.ai/skills/react-native-best-practices)
- [The Ultimate React Native App Development Guide](https://codewave.com/insights/react-native-app-development-guide-best-practices/)
