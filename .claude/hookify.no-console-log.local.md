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

🚫 **Blocked: `console.log` in TypeScript file**

Debug logging must not be committed to TypeScript source files in this project.

**Alternatives:**

- Remove the log statement entirely
- Use a proper error boundary or error handler
- If debugging is needed, ask the user to add logs themselves temporarily
