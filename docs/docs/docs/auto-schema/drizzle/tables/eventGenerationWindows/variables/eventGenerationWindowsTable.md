[Admin Docs](/)

***

# Variable: eventGenerationWindowsTable

> `const` **eventGenerationWindowsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/eventGenerationWindows.ts:24](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/drizzle/tables/eventGenerationWindows.ts#L24)

Drizzle ORM postgres table definition for event generation window configuration.

This table stores configuration settings for the generation hot window
per organization. It controls how far ahead the background worker should
pre-calculate and store event instances.
