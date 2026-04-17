---
name: block-dangerous-rm
enabled: true
event: bash
pattern: rm\s+-rf
action: block
---

Blocked: dangerous `rm -rf` command.
Require explicit user confirmation before destructive deletion.
