---
name: accessibility
description: >
  Mobile accessibility guidelines for Autocare React Native app.
  VoiceOver (iOS) and TalkBack (Android), WCAG 2.1 Level AA adapted for mobile.
  Use when creating or updating any interactive UI component, screen, or form.
triggers:
  - 'accessibility'
  - 'voiceover'
  - 'talkback'
  - 'screen reader'
  - 'accessible'
  - 'accessibilityLabel'
  - 'touch target'
allowed-tools: [Read, Write, Edit, Bash]
---

# Mobile Accessibility — React Native

Target: **WCAG 2.1 Level AA** adapted for mobile. Both VoiceOver (iOS) and TalkBack (Android).

For detailed code examples and platform specifics: read `references/full-guide.md`

---

## Core Props

| Prop                       | Purpose                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `accessibilityRole`        | Semantic role: `'button'`, `'link'`, `'image'`, `'switch'`, `'header'`, `'search'`, `'list'`, `'listitem'`, `'tab'` |
| `accessibilityLabel`       | Readable name for screen readers                                                                                    |
| `accessibilityHint`        | Extra context for non-obvious actions                                                                               |
| `accessibilityState`       | Current state: `{ disabled, checked, selected, expanded }`                                                          |
| `accessible={false}`       | Hides decorative elements from screen readers                                                                       |
| `accessibilityViewIsModal` | Traps focus inside modals (both iOS + Android)                                                                      |
| `accessibilityLiveRegion`  | Announces dynamic content: `'polite'` or `'assertive'`                                                              |

---

## Interactive Elements Checklist

- [ ] Every `Pressable` / `TouchableOpacity` has `accessibilityRole="button"` and `accessibilityLabel`
- [ ] Icon-only buttons have descriptive `accessibilityLabel` (not the icon name)
- [ ] `accessibilityHint` only for non-obvious actions — don't repeat the label
- [ ] `accessibilityState={{ disabled: true }}` mirrors visual disabled state
- [ ] `accessibilityState={{ selected: true }}` for tabs, toggles, options
- [ ] Links use `accessibilityRole="link"`, not `"button"`

```tsx
// ✅ Icon-only button
<Pressable
  onPress={handleClose}
  accessibilityRole="button"
  accessibilityLabel={t('common.close')}
>
  <Icon as={XIcon} />
</Pressable>

// ✅ Toggle/switch
<Pressable
  onPress={toggleBiometrics}
  accessibilityRole="switch"
  accessibilityLabel={t('accountDetails.biometric')}
  accessibilityState={{ checked: isEnabled }}
/>

// ✅ Decorative image
<Image source={decorativeBanner} accessible={false} />
```

---

## Touch Targets

- [ ] Minimum **44×44pt** on iOS / **48×48dp** on Android
- [ ] If visual element is smaller, use `hitSlop` to expand touch area:

```tsx
<Pressable
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  accessibilityRole="button"
  accessibilityLabel={t('action.delete')}
>
  <Icon as={TrashIcon} size="sm" />
</Pressable>
```

---

## Forms

- [ ] Every input has a visible label or `accessibilityLabel`
- [ ] Error messages are associated with the field (render inline, not just in a toast)
- [ ] `accessibilityLiveRegion="polite"` on error message container so screen readers announce it

```tsx
<Controller
  render={({ field }) => (
    <>
      <TextInput
        accessibilityLabel={t('login.phoneNumber')}
        accessibilityHint={t('login.phoneHint')}
        {...field}
      />
      {error && (
        <Text accessibilityLiveRegion="polite" className="text-error-500">
          {error.message}
        </Text>
      )}
    </>
  )}
/>
```

---

## Dynamic Content

- [ ] Results that update without navigation: `accessibilityLiveRegion="polite"` on container
- [ ] Loading → loaded transitions: announce via `accessibilityLiveRegion`
- [ ] Toast/alert messages use `'assertive'` for errors, `'polite'` for success

---

## Modals

- [ ] `accessibilityViewIsModal={true}` on the modal root view
- [ ] First focusable element in modal is focused on open
- [ ] Dismissal returns focus to the trigger element

---

## Lists

```tsx
// Accessible list
<View accessibilityRole="list">
  {items.map(item => (
    <View key={item.id} accessibilityRole="listitem">
      <Text>{item.label}</Text>
    </View>
  ))}
</View>
```

---

## Color & Contrast

- [ ] Don't use color alone to convey meaning — add icon or text label
- [ ] Contrast ratio 4.5:1 minimum for body text, 3:1 for large text / UI components
- [ ] Use NativeWind theme token classes — they are designed for consistent contrast

---

## Platform Differences (iOS vs Android)

| Aspect              | iOS VoiceOver              | Android TalkBack        |
| ------------------- | -------------------------- | ----------------------- |
| Activation          | Double-tap                 | Double-tap              |
| Swipe navigation    | Single swipe left/right    | Single swipe left/right |
| Focus trap in modal | `accessibilityViewIsModal` | Same prop               |
| Live region         | `accessibilityLiveRegion`  | Same prop               |
| Custom actions      | `accessibilityActions`     | Same API                |

Test with real devices — simulator screen readers have gaps.

---

## Quick Audit

When reviewing a screen or component:

1. Can every interactive element be reached without vision?
2. Is every button/link/input clearly labeled?
3. Are loading and error states announced?
4. Are touch targets large enough?
5. Are modal focus traps in place?
