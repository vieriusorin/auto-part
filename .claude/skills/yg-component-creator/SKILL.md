---
name: yg-component-creator
description: >
  Creating React Native components and screens for Autocare mobile app.
  React Native 0.79 + Expo 53, NativeWind (Tailwind), TypeScript strict.
  Use when creating any new component, screen, or UI element.
allowed-tools: [Bash, Write, Read, Glob]
---

# YG Component Creator

## Non-obvious rules

- This is **React Native + Expo** — no `'use client'`, no `page.tsx`, no web HTML elements
- UI: check `src/components/ui/` first, then React Native core primitives
- Styling: `className` for static Tailwind, `style={{}}` only for computed/dynamic values
- All visible strings: `const { t } = useTranslation()` then `t('domain.key')`
- Navigation: `useNavigation()` from `@react-navigation/native`, not `useNavigate()`
- `type` not `interface` — ESLint will error on `interface`

## Before You Write Any Code

Read an existing similar component first. This grounds import paths in reality.

```
1. Glob: src/screens/[closest-screen]/
   or: src/components/[closest-feature]/
2. Read the component — note: import paths, className patterns,
   which shared UI primitives are used, how t() is called
3. Check src/locales/metadata/ro.json for existing keys in the namespace
```

State which file you read before writing.

## Component Folder Structure

```
src/components/MyComponent/
  MyComponent.tsx    ← component definition
  index.tsx          ← export { MyComponent } from './MyComponent'
```

Sub-components that only live within the parent — colocate in the same folder:

```
src/components/wallet/WalletCard/
  WalletCard.tsx
  WalletCardBalance.tsx   ← internal sub-component
  index.tsx
```

## Screen Folder Structure

```
src/screens/MyScreen/
  MyScreen.tsx
  index.tsx          ← export { MyScreen } from './MyScreen'
  __tests__/
    MyScreen.test.tsx
```

## Component Template

```tsx
import { useTranslation } from 'react-i18next';

import { Pressable, Text, View } from 'react-native';

type MyComponentProps = {
  title: string;
  onPress: () => void;
};

export const MyComponent = ({ title, onPress }: MyComponentProps) => {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} className="w-full">
      <View className="rounded-xl bg-background-50 p-4">
        <Text className="font-semibold text-typography-900">
          {t('domain.key')}
        </Text>
      </View>
    </Pressable>
  );
};
```

## Screen Template

```tsx
import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useGetSomething } from '@/api/something/queries';
import { useMyStore } from '@/store/my-store';

const MyScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { someId } = useMyStore();
  const { data, isFetching, refetch } = useGetSomething(someId);
  const { refreshing, onRefresh } = useRefreshState([refetch]);

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  );
};
```

## Naming Checklist

- [ ] Component name: `PascalCase` (file + folder + export)
- [ ] Non-component files: `kebab-case` (`my-utils.ts`)
- [ ] Props type: `type MyComponentProps = { ... }` (not interface)
- [ ] Hook: `useCamelCase`

## Styling Checklist

- [ ] Static values → `className="rounded-xl bg-background-50 p-4"`
- [ ] Dynamic/computed values → `style={{ width: computedWidth }}`
- [ ] No hardcoded hex colors → use Tailwind tokens
- [ ] No `StyleSheet.create()` unless there's a measured performance reason

## i18n Checklist

- [ ] `const { t } = useTranslation()` at top of component
- [ ] Every visible string uses `t('namespace.key')`
- [ ] New keys added to both `src/locales/metadata/ro.json` and `en.json`
- [ ] Interpolation: `t('key', { count: n })` with `{{count}}` in JSON

## Accessibility Checklist

- [ ] Touchable elements have `accessibilityLabel`
- [ ] Icon-only buttons have descriptive `accessibilityLabel`
- [ ] Decorative images have `accessible={false}`
- [ ] Form inputs have `accessibilityLabel` or visible label
- [ ] Minimum touch target: 44×44 (iOS) / 48×48dp (Android)
- [ ] Loading states announced: `accessibilityLiveRegion="polite"` on result containers

## After Writing

Run `pnpm type-check` and verify no TypeScript errors.
