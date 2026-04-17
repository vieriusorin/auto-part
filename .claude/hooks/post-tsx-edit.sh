#!/bin/bash
#
# YG PostToolUse Hook — Page Preview Hint
#
# Fires after Edit or Write on .tsx files inside apps/tenant-ksa/src/app/pages/
# Maps the edited file to its likely route and suggests /yg-preview.
#
# This hook is intentionally lightweight — it only prints a hint.
# It does NOT open the browser automatically (that's noisy during iterative editing).
# Use /yg-preview to open the browser when you're ready to inspect.
#
# ─── How It Receives Data ────────────────────────────────────────────────────
# Claude Code passes tool input as JSON via stdin:
#   { "tool_name": "Edit", "tool_input": { "file_path": "/abs/path/to/file.tsx" } }
#
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Read JSON from stdin
INPUT=$(cat)

# Extract file_path from tool_input using Python (available everywhere)
FILE=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

# Guard: only process .tsx files in the pages/ directory
if [[ -z "$FILE" ]]; then exit 0; fi
if [[ "$FILE" != *"/pages/"* ]]; then exit 0; fi
if [[ "$FILE" != *.tsx ]]; then exit 0; fi

# ─── Map file path to route ───────────────────────────────────────────────────
#
# Example:
#   /abs/.../apps/tenant-ksa/src/app/pages/corePlatform/vpp/index.tsx
#   → strip to: corePlatform/vpp/index.tsx
#   → strip trailing /index.tsx or .tsx: corePlatform/vpp
#   → camelCase → kebab-case per character: core-platform/vpp
#   → prepend /: /core-platform/vpp

# Strip everything up to and including /pages/
RELATIVE="${FILE##*/pages/}"

# Strip /index.tsx or .tsx suffix
RELATIVE="${RELATIVE%/index.tsx}"
RELATIVE="${RELATIVE%.tsx}"

# Convert camelCase to kebab-case: insert hyphen before each uppercase letter
ROUTE=$(echo "$RELATIVE" | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')
ROUTE="/${ROUTE}"

# ─── Print hint ───────────────────────────────────────────────────────────────

echo ""
echo "  Page edited: $(basename "$FILE")"
echo "  Run /yg-preview ${ROUTE} to preview this page in Chrome."
echo ""
