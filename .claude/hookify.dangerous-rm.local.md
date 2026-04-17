---
name: block-dangerous-rm
enabled: true
event: bash
pattern: rm\s+-rf
action: block
---

🚫 **Blocked: dangerous `rm -rf` command**

This command has been blocked. `rm -rf` permanently deletes files with no recovery.

**Before proceeding:**

- Confirm the exact path is correct
- Verify there are no uncommitted changes in the target directory
- Ask the user to run this command manually if it's genuinely needed
