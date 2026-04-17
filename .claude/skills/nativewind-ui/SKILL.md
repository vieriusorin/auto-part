---
name: nativewind-ui
description: >
  NativeWind-first UI creation for the Autocare React Native app.
  Use when creating or refactoring components/screens with Tailwind-style classes,
  shared UI wrappers, token-based colors, and React Native primitives.
triggers:
  - 'nativewind'
  - 'tailwind in react native'
  - 'create component'
  - 'style this screen'
  - 'refactor ui'
allowed-tools: [Read, Write, Edit, Glob]
---

# NativeWind UI Skill

## Stack assumptions

- React Native 0.79 + Expo 53
- NativeWind (Tailwind-style classes)
- Shared UI wrappers in `src/components/ui/*`
- React Native core primitives for fallback (`View`, `Text`, `Pressable`, `FlatList`)

## Rules

- Use `className` for static styling.
- Use `style={{}}` only for computed/dynamic values.
- No hardcoded visible strings; use `t('namespace.key')`.
- No hardcoded hex colors when token classes exist.
- Prefer existing wrappers in `src/components/ui/*` before raw primitives.

## Component pattern

```tsx
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type CardProps = {
  title: string;
  onPress: () => void;
};

export const Card = ({ title, onPress }: CardProps) => {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} className='w-full'>
      <View className='rounded-xl bg-background-50 p-4'>
        <Text className='text-typography-900 font-semibold'>
          {title || t('common.fallbackTitle')}
        </Text>
      </View>
    </Pressable>
  );
};
```

## Checklist

- [ ] Read a similar component first.
- [ ] Use arrow-function component definitions.
- [ ] Keep `type` over `interface`.
- [ ] Confirm no legacy UI-kit imports.
- [ ] Verify translation keys exist in both `ro.json` and `en.json`.
