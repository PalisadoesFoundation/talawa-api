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

### Why?
Without this cleanup, mocks from one test file can leak into others, causing:
- Flaky tests that fail randomly.
- "Spooky action at a distance" where a change in one file breaks an unrelated test.
- Failures when running tests in parallel (sharding).

### Verification
We have a script that verifies this rule. You can run it locally:

```bash
npm run check_mock_isolation
```

To automatically fix violations:

```bash
npm run check_mock_isolation -- --fix
```
