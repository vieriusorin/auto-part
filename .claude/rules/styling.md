# Styling

Stack: **NativeWind (Tailwind CSS for React Native)**.

## Rules

- Use `className` with Tailwind utilities for layout, spacing, colors, typography
- Use `style={{}}` **only** for values Tailwind can't express: computed dimensions, box shadows, animated styles
- Use NativeWind theme tokens/classes — never hardcoded hex values
- Check `src/components/ui/` for existing wrappers before using raw React Native primitives

## Component Priority

1. `src/components/ui/*` — project-level wrappers (check here first)
2. `src/components/common/*` — shared cross-feature components
3. React Native core primitives — `View`, `Text`, `Pressable`, `ScrollView`, `FlatList`

## Pattern

```tsx
// ✅ Correct
<View className="rounded-xl bg-background-50 p-4">
  <View className="flex-row items-center gap-4">
    <Text className="text-primary-300">{t('icon.label')}</Text>
    <Text className="text-lg font-semibold text-typography-900">
      {t('label.key')}
    </Text>
  </View>
</View>

// Dynamic value that Tailwind can't express → style prop
<View
  className="rounded-xl bg-background-50"
  style={{ boxShadow: '-2px 2px 4px rgba(0,0,0,0.05)' }}
/>

// ❌ Wrong — hardcoded color
<View style={{ backgroundColor: '#1A2B3C' }} />

// ❌ Wrong — inline style for something Tailwind can handle
<View style={{ padding: 16, borderRadius: 12 }} />
```

## Color Tokens

Use NativeWind semantic tokens, not raw hex:

| Token                                    | Use for                  |
| ---------------------------------------- | ------------------------ |
| `text-primary-300` / `bg-primary-500`    | Brand colors             |
| `text-typography-900`                    | Primary text             |
| `bg-background-50` / `bg-background-100` | Card/surface backgrounds |
| `text-error-500`                         | Error states             |

## No Inline Styles for Static Values

If the value is static, express it with Tailwind. `style={{}}` is reserved for truly dynamic values (e.g. from state, props, or animations).
