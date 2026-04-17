# Agent Orchestration Guide

How Claude's agents and skills work together in this project.
Read this before deciding which skill or agent to invoke.

---

## Decision Tree — Which workflow do I need?

```
Starting a new feature or screen?
  └─ /yg-feature-builder

Just reviewed/modified code and need to validate it?
  └─ /yg-quality-gate

Debugging a specific error?
  ├─ Simple (TS error, styling, known pattern) → /yg-debugger
  └─ Complex (reproduce/isolate unknown bug)   → /gsd:debug

Planning a large feature or milestone?
  └─ /gsd:plan-phase → /gsd:execute-phase → /gsd:verify-work
```

---

## Workflow 1 — Feature Build

**Orchestrator:** `/yg-feature-builder` (skill)

```
PLAN
  ├─ Read existing similar files
  ├─ Clarify scope (API endpoint? form? screen?)
  └─ Identify files to create/modify

CREATE  (inline skills, no subprocess)
  ├─ yg-component-creator  — new screens or UI components
  ├─ yg-api-integration    — useQuery / useMutation hooks
  └─ yg-form-builder       — React Hook Form + Controller

VALIDATE
  └─ triggers yg-quality-gate (see Workflow 2)
```

**When to use:** Any change larger than a one-line fix. New screens, new features, API integrations, form additions.

---

## Workflow 2 — Code Review (Quality Gate)

**Orchestrator:** `/yg-quality-gate` (skill — aggregates all agent outputs)

```
yg-quality-gate
  │
  ├── best-practices         [always]   RN patterns, TS strictness, TanStack Query v5,
  │                                     forms, i18n compliance, navigation patterns
  │
  ├── design-system-enforcer [always]   NativeWind className, theme token classes,
  │                                     no hardcoded hex, component hierarchy
  │
  ├── accessibility-auditor  [always, UI files]
  │                                     VoiceOver/TalkBack, touch targets (44pt/48dp),
  │                                     accessibilityRole/Label/Hint, modal focus traps
  │
  ├── testing-reviewer       [always, test files]
  │                                     QueryClientProvider setup, faker data, mock level,
  │                                     getByTestId priority, no nested describe
  │
  ├── performance            [always, screens/lists]
  │                                     FlatList vs ScrollView+map, Reanimated, memoization,
  │                                     TanStack Query staleTime, image loading
  │
  ├── security               [if: auth, tokens, deep links, payment, PII]
  │                                     SecureStore, JWT, biometrics, insecure patterns
  │
  ├── ios-platform           [if: platform-specific code changed]
  │                                     Safe areas, shadow props, App Store requirements
  │
  └── android-platform       [if: platform-specific code changed]
                                        BackHandler, elevation, Play Store requirements
```

**Output contract** — every agent returns the same structure:

```
BLOCKERS   — must fix before merge (CI will catch or real user impact)
WARNINGS   — strong recommendation (tech debt, pattern violation)
PASSED     — explicitly verified clean
```

`security` adds: `CRITICAL` (security hole) before `BLOCKERS`.

---

## Workflow 3 — Debug

```
Symptoms → /yg-debugger (skill, inline)
  Covers: TypeScript errors, TanStack Query, NativeWind styling, navigation,
          platform differences, Expo build issues
  Output: root cause + fix

Complex / can't reproduce → /gsd:debug (agent, persistent session)
  Uses scientific method: hypothesis → test → result → next hypothesis
  Maintains debug state across context resets via debug file
```

---

## Workflow 4 — Large Feature / GSD Planning

For milestone-scale work tracked in `.planning/`:

```
/gsd:plan-phase
  ├─ gsd-phase-researcher   research → RESEARCH.md
  ├─ gsd-planner            plan → PLAN.md (2-3 tasks max)
  └─ gsd-plan-checker       verify plan achieves goal

/gsd:execute-phase
  └─ gsd-executor           atomic commits per task, deviation handling

/gsd:verify-work
  └─ gsd-verifier           goal-backward check (not just task completion)

Post-phase:
  /gsd:validate-phase → gsd-nyquist-auditor   fill test gaps
  /gsd:audit-milestone → gsd-integration-checker  cross-phase wiring
```

---

## Agent Reference

### Review Agents (spawned by yg-quality-gate)

| Agent                    | Trigger condition                                  | Hard boundaries                                         |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------- |
| `best-practices`         | Always                                             | Does not check styling tokens, a11y props, or security  |
| `design-system-enforcer` | UI files (.tsx)                                    | Does not assess UX flow or accessibility semantics      |
| `accessibility-auditor`  | Interactive UI, forms, modals                      | Does not assess visual design or performance            |
| `performance`            | Screens, lists, charts, animations                 | Does not assess security or a11y                        |
| `security`               | Auth flows, token handling, deep links, payment    | Does not assess code quality or performance             |
| `ios-platform`           | iOS-specific code, SafeAreaView, shadow, App Store | Does not cover Android                                  |
| `android-platform`       | BackHandler, elevation, Play Store                 | Does not cover iOS                                      |
| `testing-reviewer`       | `__tests__/*.test.ts(x)` files                     | Does not assess runtime behavior or coverage thresholds |

### Meta Agents

| Agent             | Purpose                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `agent-optimizer` | Reviews agent `.md` and skill `SKILL.md` files for quality, staleness, coverage gaps. Run when updating agents. |

### GSD Agents (planning pipeline)

| Agent                     | Role                                                     |
| ------------------------- | -------------------------------------------------------- |
| `gsd-phase-researcher`    | Fetches docs, finds patterns, writes RESEARCH.md         |
| `gsd-planner`             | Writes executable PLAN.md (2-3 tasks, goal-backward)     |
| `gsd-plan-checker`        | Verifies plan will achieve goal before execution         |
| `gsd-executor`            | Executes PLAN.md with atomic commits                     |
| `gsd-verifier`            | Checks codebase actually delivers what phase promised    |
| `gsd-nyquist-auditor`     | Fills test coverage gaps after a phase                   |
| `gsd-integration-checker` | Verifies cross-phase wiring (exports→imports, E2E flows) |
| `gsd-codebase-mapper`     | Maps codebase architecture to `.planning/codebase/`      |
| `gsd-debugger`            | Scientific debugging with persistent session state       |

---

## Skill Reference

### Build Skills (used inline during feature development)

| Skill                  | When                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `yg-component-creator` | Creating any new component, screen, or UI element           |
| `yg-api-integration`   | Adding useQuery/useMutation hooks, new API domain           |
| `yg-form-builder`      | Any form with React Hook Form + Controller                  |
| `yg-feature-builder`   | Orchestrates the full build workflow (PLAN→CREATE→VALIDATE) |

### Reference Skills (knowledge base — used inline)

| Skill                  | Knowledge domain                                                  |
| ---------------------- | ----------------------------------------------------------------- |
| `tanstack-query`       | TanStack Query v5 patterns, query key factories, cache config     |
| `accessibility`        | VoiceOver/TalkBack props, WCAG 2.1 mobile patterns                |
| `coding-standards`     | Naming, TypeScript, file structure checklists                     |
| `nativewind-ui`        | NativeWind-first UI patterns with shared wrappers                 |
| `security-review`      | SecureStore, JWT patterns, deep link validation                   |
| `context7-docs-lookup` | Live library docs via Context7 (always prefer over training data) |
| `yg-debugger`          | Error patterns, debugging steps by error category                 |

### Utility Skills

| Skill             | When                                                   |
| ----------------- | ------------------------------------------------------ |
| `yg-quality-gate` | After any code change — triggers review agent team     |
| `yg-preview`      | Preview a screen in headed Chrome                      |
| `grill-me`        | Stress-test a design or plan with relentless questions |

---

## Skill vs Agent — When to Use Which

**Use a skill** when:

- The workflow should run inline in the main context
- You need a knowledge base / checklist Claude reads while writing code
- The task is a guided workflow (step-by-step instructions for Claude)

**Use an agent** when:

- The task can be isolated with its own context budget
- Multiple agents can run in parallel (quality gate pattern)
- The agent is spawned by an orchestrator, not the user directly

---

## Output Format Contract

All review agents use the same three-tier output:

```
## BLOCKERS
- [agent-name] Description of what must be fixed and why.

## WARNINGS
- [agent-name] Description of recommended fix.

## PASSED
- [agent-name] What was explicitly verified clean.
```

The `yg-quality-gate` aggregates these into a single report grouped by severity across all agents.
