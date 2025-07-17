[Admin Docs](/)

***

# Variable: materializedEventInstancesTable

> `const` **materializedEventInstancesTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/materializedEventInstances.ts:34](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/drizzle/tables/materializedEventInstances.ts#L34)

Drizzle ORM postgres table definition for materialized event instances.

This table stores pre-calculated instances of recurring events within a hot window
(typically 12-24 months ahead). Each instance represents a specific occurrence
of a recurring event with calculated dates and times.

The actual event properties (name, description, etc.) are resolved at query time by:
1. Inheriting from the base template event
2. Applying any exceptions from the event_exceptions table

This approach eliminates data duplication while providing fast date-range queries.
