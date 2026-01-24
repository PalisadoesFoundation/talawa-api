[API Docs](/)

***

# Variable: eventGenerationWindowsTable

> `const` **eventGenerationWindowsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: src/drizzle/tables/eventGenerationWindows.ts:24

Drizzle ORM postgres table definition for event generation window configuration.

This table stores configuration settings for the generation hot window
per organization. It controls how far ahead the background worker should
pre-calculate and store event instances.
