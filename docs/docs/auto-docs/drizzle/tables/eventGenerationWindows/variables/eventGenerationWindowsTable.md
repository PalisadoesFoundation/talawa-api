[**talawa-api**](../../../../README.md)

***

# Variable: eventGenerationWindowsTable

> `const` **eventGenerationWindowsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/eventGenerationWindows.ts:24](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/eventGenerationWindows.ts#L24)

Drizzle ORM postgres table definition for event generation window configuration.

This table stores configuration settings for the generation hot window
per organization. It controls how far ahead the background worker should
pre-calculate and store event instances.
