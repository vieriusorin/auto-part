---
name: block-console-log
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(ts|tsx)$
  - field: new_text
    operator: regex_match
    pattern: console\.(log|warn|error|info|debug)\(
action: block
---

Blocked: console logging in TypeScript source.
Remove debug logs before completion.
