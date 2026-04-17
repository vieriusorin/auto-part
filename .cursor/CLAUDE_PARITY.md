# Claude -> Cursor Parity

This directory mirrors operational guidance from `.claude` into Cursor-native docs/rules.

## Mirrored assets

- `.claude/STACK.md` -> `.cursor/rules/Autocare-stack.mdc`
- `.claude/rules/*` -> `.cursor/rules/*.mdc` (core equivalents)
- `.claude/ORCHESTRATION.md` -> `.cursor/ORCHESTRATION.md`
- `.claude/agents/*.md` -> `.cursor/agents/*.md`
- `.claude/commands/yg-preview.md` -> `.cursor/commands/yg-preview.md`
- `hookify.*.local.md` -> `.cursor/hooks/*.md`

## Scope note

Claude-specific runtime settings in `.claude/settings.json` and `.claude/settings.local.json`
are not 1:1 portable to Cursor internals. Equivalent behavior is represented through
`.cursor/rules`, `.cursor/agents`, `.cursor/commands`, and `.cursor/hooks`.

## Maintenance

When updating any source in `.claude`, update the mirrored `.cursor` counterpart in the same PR.
