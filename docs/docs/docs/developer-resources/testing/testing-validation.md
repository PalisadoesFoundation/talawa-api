---
sidebar_position: 4
title: Testing Validation
---

# Testing Validation

## Mock Isolation & Cleanup

To ensure reliable test execution, especially in parallel environments, it is critical to properly isolate mocks in your tests.

### The Rule
If you use `vi.mock()`, `vi.fn()`, or `vi.spyOn()` in a test file, you **MUST** include a cleanup hook to reset the mocks after each test.

### How to Implement
Add the following `afterEach` hook to your test file:

```typescript
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.clearAllMocks();
});
```

### Choosing the Right Cleanup Method

Vitest provides several cleanup methods. Here's when to use each:

| Method | What It Does | When to Use |
|--------|--------------|-------------|
| `vi.clearAllMocks()` | Clears call history and results | **Recommended default** - Resets mock state while preserving implementation |
| `vi.resetAllMocks()` | Clears history + resets implementation to `vi.fn()` | When you need to remove custom mock implementations |
| `vi.restoreAllMocks()` | Clears history + restores original implementation | Only for `vi.spyOn()` - restores the real function |
| `vi.resetModules()` | Clears module cache | When module-level state causes issues (rare) |

**Best Practice:** Use `vi.clearAllMocks()` in most cases. It's the safest option that works for all mock types.

### Why?
Without this cleanup, mocks from one test can leak into others, causing:
- Flaky tests that fail randomly
- "Spooky action at a distance" where a change in one file breaks an unrelated test
- Failures when running tests in parallel (sharding)

### Verification
We have a script that verifies this rule. You can run it locally:

```bash
npm run check_mock_isolation
```

To automatically fix violations:

```bash
npm run check_mock_isolation -- --fix
```

### Environment Variables

**`MOCK_ISOLATION_FAIL_ON_ERROR`**

Controls whether the check fails the build or just warns:
- `true` - Exits with code 1 if violations are found (fails CI)
- `false` or unset - Exits with code 0 with warnings (default)

Example:
```bash
MOCK_ISOLATION_FAIL_ON_ERROR=true npm run check_mock_isolation
```

### Troubleshooting

**"No problems found" but tests still fail in parallel**

Check for:
- Global state mutations outside of mocks
- Database fixtures not properly isolated
- Shared test data between files

**"Module mocks not being reset"**

Use `vi.resetModules()` in addition to `vi.clearAllMocks()`:

```typescript
afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});
```

**"Spy on original implementation still called"**

You're likely using `vi.spyOn()`. Use `vi.restoreAllMocks()` instead:

```typescript
afterEach(() => {
  vi.restoreAllMocks();
});
```
