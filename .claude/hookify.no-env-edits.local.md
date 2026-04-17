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

🚫 **Blocked: editing sensitive file**

This file likely contains secrets, credentials, or environment configuration. Editing it automatically is blocked.

**Action required:**

- Ask the user to make this change manually
- Never hardcode secrets or tokens in environment files
- Ensure `.env` files are listed in `.gitignore`
