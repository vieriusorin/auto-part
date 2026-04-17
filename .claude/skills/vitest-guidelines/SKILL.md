---
name: vitest-guidelines
description: Vitest testing standards and review checklist for deterministic, maintainable, fast test suites.
---

# Vitest Guidelines

Use this skill whenever writing, reviewing, or refactoring Vitest tests and setup.

Primary goals:
- deterministic and non-flaky tests
- explicit and readable test code
- fast feedback in watch mode and CI
- meaningful coverage of behavior (not implementation noise)

---

## Trigger Conditions

Activate when the user asks for:
- Vitest tests (`*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`)
- test setup/config (`vitest.config.*`, Vite `test` block, setup files)
- test quality review, flaky test debugging, mocking strategy
- migration from Jest or cleanup of poor test patterns

---

## Core Principles

1. **Arrange-Act-Assert**
   - Keep each test readable and scoped to one behavior.
2. **Explicit over magical**
   - Prefer importing `describe`, `it`, `expect`, `vi` from `vitest`.
   - Enable globals only if the project already standardizes on it.
3. **Isolation first**
   - Prevent shared mutable state across tests/files.
   - Reset mocks, spies, timers, and module state in lifecycle hooks.
4. **Behavior over implementation**
   - Assert public outcomes and user-observable behavior.
   - Avoid asserting private internals unless unavoidable.

---

## File and Suite Organization

- Keep unit tests close to source when possible.
- For large repos, allow `tests/` for integration/e2e/shared utilities.
- Use consistent naming:
  - `feature.test.ts`
  - `component.test.tsx`
  - `feature.spec.ts` (if project convention already uses spec)
- Group related behaviors with `describe` blocks.
- Keep tests short; split long scenario chains.

---

## Vitest Defaults to Respect

1. **Modern syntax by default**
   - Write ESM, TypeScript, JSX without custom transpilation workarounds.
2. **Reuse Vite config**
   - Prefer centralizing test config in Vite/Vitest config, not scattered per file.
3. **Opt-in globals**
   - Default to explicit imports for clarity and tool support.
4. **Isolated files**
   - Assume each test file runs in an isolated worker.
5. **Parallel test files**
   - Avoid cross-file dependencies and global side effects.
6. **Sequential test cases within file**
   - Do not rely on case order; make each test independent anyway.

---

## Mocking and Stubbing Rules

- Mock only external boundaries (network, filesystem, time, random, 3rd party SDKs).
- Avoid over-mocking core domain logic under test.
- Use `vi.mock()` for module boundaries and `vi.spyOn()` for targeted behavior.
- Restore/reset mocks between tests using hooks.
- Prefer project-level mock helpers over inline repeated mock setup.

Example pattern:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});
```

---

## Async and Time-based Tests

- Use `async/await` and `await expect(...).resolves/rejects`.
- Avoid un-awaited promises in tests.
- Use fake timers intentionally and always restore them.
- Never use arbitrary long `setTimeout` waits when deterministic alternatives exist.

---

## React / UI Testing Guidance

- Prefer testing behavior with Testing Library queries.
- For asynchronous UI assertions, use retryable patterns (`findBy*`, `waitFor`, or browser-mode retry APIs when applicable).
- Avoid brittle snapshots as primary verification.
- Use snapshots only for stable, low-noise outputs and review snapshot diffs critically.

---

## Flakiness Prevention

- No shared mutable state between tests.
- No dependency on execution order.
- Avoid real network requests in unit tests.
- Control timers, dates, randomness, and environment variables.
- Clean up side effects in `afterEach`.

---

## Coverage and CI Standards

- Use coverage as a signal, not a vanity metric.
- Ensure critical paths and error paths are covered.
- Add tests for edge cases:
  - null/undefined
  - empty input
  - boundary values
  - error handling paths
- Run tests in CI on every PR and block merges on failures.

---

## Anti-patterns (Reject in Review)

- tests asserting implementation details instead of behavior
- over-mocking that invalidates confidence
- flaky timing-dependent assertions
- giant tests with multiple unrelated assertions
- silently skipped/focused tests (`it.skip`, `it.only`) in committed code
- hardcoded secrets or sensitive data in test fixtures

---

## Vitest Review Checklist

- [ ] Test names describe behavior and expected outcome
- [ ] Suites use clear `describe` grouping
- [ ] Arrange-Act-Assert structure is obvious
- [ ] Mocks are minimal and reset/restored
- [ ] Async tests await all async work
- [ ] No shared state or order dependency
- [ ] Edge/error cases included where relevant
- [ ] CI-friendly (deterministic, no network coupling)
- [ ] No `only`/`skip` left behind (unless explicitly intentional and documented)

---

## Sources

- [Vitest Best Practices and Coding Standards](https://www.projectrules.ai/rules/vitest)
- [Best Techniques to Create Tests with the Vitest Framework](https://dev.to/wallacefreitas/best-techniques-to-create-tests-with-the-vitest-framework-9al)
- [Incredible Vitest Defaults](https://www.epicweb.dev/incredible-vitest-defaults)
