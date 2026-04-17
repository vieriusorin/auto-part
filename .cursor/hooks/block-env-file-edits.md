---
name: block-env-file-edits
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: (\.env|\.env\.\w+|credentials|secrets)(\.\w+)?$
action: block
---

Blocked: sensitive file edit.
Ask the user to edit env/secrets manually.
