[**talawa-api**](../../../../README.md)

***

# Variable: eventExceptionsTable

> `const` **eventExceptionsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/recurringEventExceptions.ts:22](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/recurringEventExceptions.ts#L22)

Drizzle ORM postgres table definition for recurring event exceptions.
This table stores instance-specific modifications to recurring events.
When a user modifies a single instance or "this and future" instances,
the changes are stored here as differences from the template.

Clean design principles:
- Direct reference to recurring_event_instances.id for precise targeting
- JSON-based exception data for flexible field modifications
- Template reference can be derived via instance.baseRecurringEventId (no redundant storage)
- All exceptions are single-instance modifications (no type differentiation needed)
