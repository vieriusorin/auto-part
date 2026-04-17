---
name: block-hardcoded-jsx-strings
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.tsx$
  - field: new_text
    operator: regex_match
    pattern: (label|placeholder|helperText|aria-label)=["'][A-Z][a-z]
action: block
---

🚫 **Blocked: hardcoded string in JSX prop**

This project uses **i18next** for all user-visible text. Hardcoded English strings in JSX are not allowed.

**Required pattern:**

```tsx
// ❌ Wrong
<TextField label="First name" placeholder="Enter name" />;

// ✅ Correct
const { t } = useTranslation();
<TextField
  label={t('user.firstName')}
  placeholder={t('user.firstNamePlaceholder')}
/>;
```

**Steps:**

1. Add the translation key to both `src/locales/metadata/en.json` and `src/locales/metadata/ro.json`
2. Use `t('domain.key')` in the component
