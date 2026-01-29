# createEvent: Notification Enqueue After Transaction Commit

## Decision

In `createEvent`, notification enqueue (`enqueueEventCreated`) runs **after** the database transaction commits. It is **not** inside the transaction.

- **Behavior:** Transaction commits → event row (and related data) is persisted → then notification is enqueued.
- **Risk:** If enqueue fails after the transaction has committed, the database changes are **not** rolled back (fire-and-forget semantics). The event exists in the DB but the notification may not be sent.

## Rationale

- Keeps transaction short and avoids holding the DB connection during external/async notification work.
- Notification failure is logged; retry or reconciliation can be handled at the notification layer.

## Before merge

- [X] **Accepted** that fire-and-forget notification behavior is acceptable (no rollback if enqueue fails).

## References

- Code: `src/graphql/types/Mutation/createEvent.ts` (comment above notification enqueue block).
- Validation checklist: [Performance monitoring → Critical validations](./performance-monitoring.md#critical-validations-mutation-instrumentation).
