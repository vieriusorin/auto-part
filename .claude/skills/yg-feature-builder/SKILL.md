---
name: yg-feature-builder
description: >
  Master orchestrator for building or refactoring Autocare mobile app features.
  Three phases: PLAN → CREATE → VALIDATE.
  Use for any non-trivial feature, component, API integration, or refactor.
allowed-tools: [Bash, Read, Write, Edit, Glob, Grep, Task]
---

# YG Feature Builder — Plan → Create → Validate

Use for any change larger than a one-line fix. Prevents pattern drift and ensures
every change passes quality gates before a commit message is suggested.

---

## PHASE 1: PLAN

### 1a. Understand the request

Ask if any of these are ambiguous:

- What does this do from the user's perspective?
- What data does it need (which API endpoint)?
- New feature or modifying existing code?
- iOS, Android, or both?

**Do not proceed until you understand the scope.**

### 1b. Explore first

```
1. Glob similar existing screen or component — use as pattern reference
2. Read 1-2 similar existing files (screen + hook if applicable)
3. Check src/locales/metadata/ro.json for existing translation keys in namespace
4. If touching API: check src/api/[domain]/ for existing domain structure
```

### 1c. Output the Plan

```markdown
## Plan: [Feature Name]

### Scope

[One-sentence description]

### Pattern Reference

I read: [file path(s)] — will follow this pattern

### Files to Create

- [ ] src/screens/[Name]/[Name].tsx — screen component
- [ ] src/api/[domain]/queries.ts — API hook
- [ ] src/api/[domain]/query-keys.ts — cache key factory

### Files to Modify

- [ ] src/navigation/types.d.ts — new route params
- [ ] src/locales/metadata/ro.json — new translation keys
- [ ] src/locales/metadata/en.json — new translation keys

### Approach

[2-3 sentences: how it works, which patterns are reused]

### Validators to Run

- [ ] TypeScript (always)
- [ ] Accessibility (if new UI)
- [ ] Design system (if new UI)
- [ ] Security (if auth/token/form submission)
- [ ] Performance (if list, chart, or heavy data)

### Risks

[Anything uncertain — endpoint existence, naming, platform differences]
```

**Wait for confirmation before proceeding to Phase 2.**

---

## PHASE 2: CREATE

Delegate to the appropriate skill:

| What's being built        | Follow skill           |
| ------------------------- | ---------------------- |
| Component or screen       | `yg-component-creator` |
| Form                      | `yg-form-builder`      |
| API hook (query/mutation) | `yg-api-integration`   |
| Debugging an error        | `yg-debugger`          |

Follow the skill's **read-before-write** protocol.

As you write each file, output:

```
✍️  Writing: [file path]
    Pattern from: [reference file]
```

---

## PHASE 3: VALIDATE

### 3a. TypeScript check

```bash
pnpm type-check 2>&1 | head -60
```

Fix all errors before running agents.

### 3b. Run review agents (in parallel)

For **UI components**:

```
Task: accessibility-auditor
Task: design-system-enforcer
(see yg-quality-gate for exact prompts)
```

For **API / auth changes**:

```
Task: security
```

For **complex UI with lists or charts**:

```
Task: performance
```

### 3c. Quality Gate Report

```markdown
## Quality Gate — [Feature Name]

### ✅ Passed

### 🚫 BLOCKERS (fix before commit)

### ⚠️ WARNINGS (should fix)

### Status: READY | NEEDS FIXES
```

Fix all blockers. Re-run the specific agent after each fix.

---

## PHASE 4: COMMIT SUGGESTION

Only after Status is READY:

```markdown
## Changed Files

- src/screens/[Name]/[Name].tsx (created)
- src/api/[domain]/queries.ts (modified)
- src/locales/metadata/ro.json (modified)
- src/locales/metadata/en.json (modified)

## Suggested Commit Message

feat([scope]): add [feature name]

[One sentence about what and why]
```

Developer commits manually. Never run git commands.

---

## Trigger Phrases

- "build a feature for..."
- "create a new screen/component for..."
- "refactor [feature] to..."
- "implement [feature] following YG patterns"
