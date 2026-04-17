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

Blocked: hardcoded UI string in JSX prop.
Use i18n keys with `t('domain.key')`.
