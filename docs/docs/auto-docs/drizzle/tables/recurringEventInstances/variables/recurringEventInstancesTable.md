[API Docs](/)

***

# Variable: recurringEventInstancesTable

> `const` **recurringEventInstancesTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/recurringEventInstances.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L33)

Drizzle ORM postgres table definition for recurring event event instances.

This table stores pre-calculated instances of recurring events within a hot window
(typically 12-24 months ahead). Each instance represents a specific occurrence
of a recurring event with calculated dates and times.

The actual event properties (name, description, etc.) are resolved at query time by:
1. Inheriting from the base template event
2. Applying any exceptions from the event_exceptions table

This approach eliminates data duplication while providing fast date-range queries.
