---
name: yg-quality-gate
description: >
  Post-creation validation pipeline for Autocare mobile app. Run after ANY code change.
  Orchestrates TypeScript check + parallel review agents scoped to changed files.
  Produces a structured BLOCKERS / WARNINGS / PASSED report.
  Use standalone or as the final step in yg-feature-builder.
allowed-tools: [Bash, Read, Glob, Grep, Task]
---

# YG Quality Gate

Run after writing or modifying code. Validates the change without reviewing the full codebase.

---

## Step 1: Identify Changed Files

List files created or modified in this session. Categorize:

```
UI_COMPONENTS    = .tsx files rendering visual elements
API_HOOKS        = src/api/[domain]/queries.ts | mutations.ts | query-keys.ts
FORMS            = files importing react-hook-form
AUTH_SENSITIVE   = files touching tokens, credentials, biometrics, auth flow
STORE            = src/store/ files
NAVIGATION       = src/navigation/ files
```

A file can belong to multiple categories.

---

## Step 2: TypeScript Check (always run)

```bash
pnpm type-check 2>&1 | head -60
```

If errors → **BLOCKER** — list each error with `file:line`. Fix before proceeding.
If clean → mark ✅ TypeScript.

---

## Step 3: Select Review Agents (run in parallel)

| Category                      | Agent                    | When                      |
| ----------------------------- | ------------------------ | ------------------------- |
| UI_COMPONENTS                 | `accessibility-auditor`  | Always for UI             |
| UI_COMPONENTS                 | `design-system-enforcer` | Always for UI             |
| API_HOOKS + AUTH_SENSITIVE    | `security`               | Auth/API changes          |
| UI_COMPONENTS (lists, charts) | `performance`            | Heavy renders, large data |
| Any                           | `best-practices`         | Any significant change    |

Spawn selected agents **in parallel**. Pass each agent:

- The exact file content (Read then pass in prompt)
- The specific concern
- Stack context: React Native + Expo, NOT web

---

## Agent Prompts (copy-paste)

**accessibility-auditor:**

```
Review this React Native component for mobile accessibility.
Focus on: accessibilityLabel/Role/Hint on interactive elements, minimum touch
target sizes (44×44pt iOS / 48×48dp Android), missing accessible={false} on
decorative elements, screen reader announcements for dynamic content.
Stack: React Native 0.79 + NativeWind.
[file content]
```

**design-system-enforcer:**

```
Review this component for Autocare design system compliance.
Rules: NativeWind className for styling (not StyleSheet.create for statics),
no hardcoded hex colors (use NativeWind token classes like text-primary-300),
check src/components/ui/ was considered before using raw primitives,
style={{}} only for computed/dynamic values.
Stack: React Native + NativeWind.
[file content]
```

**security:**

```
Review this React Native code for mobile security issues.
Focus on: sensitive data in AsyncStorage (should be Expo Secure Store),
token handling patterns, deep link validation, unsafe API patterns,
data exposure in logs or error messages, biometric auth patterns.
Stack: React Native + Expo, JWT + Expo Secure Store, openapi-fetch.
[file content]
```

**performance:**

```
Review this React Native component for performance issues.
Focus on: ScrollView over .map() instead of FlatList, missing enabled
guard on queries (enabled: !!dep), form.watch() without field args,
heavy computations in render without useMemo, inline function props
without useCallback, Reanimated vs Animated API usage.
Stack: React Native 0.79, TanStack Query v5, NativeWind.
[file content]
```

---

## Step 4: Compile Report

```markdown
## Quality Gate Report — [Feature/File Name]

### ✅ Passed

- TypeScript: clean
- [Agent]: [positive finding]

### 🚫 BLOCKERS (must fix before commit)

- [Agent]: [specific issue] at [file:line]
  → Fix: [concrete action]

### ⚠️ WARNINGS (should fix)

- [Agent]: [issue]
  → Fix: [action]

### 📋 Summary

Files reviewed: [list]
Status: READY TO COMMIT | NEEDS FIXES
```

---

## Step 5: Fix Blockers

1. Fix the issue
2. Re-run only the specific agent that flagged it
3. Upgrade to ✅ when clean

---

## Trigger Phrases

- "run quality gate"
- "validate these changes"
- "review what I just wrote"
- "check the code I created"
