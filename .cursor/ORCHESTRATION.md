# Cursor Agent Orchestration Guide

Mirror of `.claude/ORCHESTRATION.md` for Cursor workflows.

## Decision Tree

Starting a new feature or screen?
- Use `yg-feature-builder` workflow.

Reviewed/modified code and need validation?
- Run `yg-quality-gate` workflow.

Debugging an error?
- Simple: `yg-debugger`.
- Complex/repro issues: `gsd:debug` style hypothesis loop.

Planning a large milestone?
- `plan-phase` -> `execute-phase` -> `verify-work`.

## Quality Gate Team

- `best-practices` (always)
- `design-system-enforcer` (always)
- `accessibility-auditor` (UI files)
- `testing-reviewer` (test files)
- `performance` (screens/lists/animations)
- `security` (auth/tokens/deep links/payment/PII)
- `ios-platform` (iOS/platform-specific changes)
- `android-platform` (Android/platform-specific changes)

## Output Contract

All reviewers report:

- `BLOCKERS` (must fix)
- `WARNINGS` (should fix)
- `PASSED` (explicitly verified clean)

`security` may add `CRITICAL` findings before `BLOCKERS`.

## Notes

- Keep this file in sync with `.claude/ORCHESTRATION.md`.
- Use `.cursor/rules/*.mdc` for always-on guardrails.
