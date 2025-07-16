[Admin Docs](/)

***

# Variable: eventMaterializationWindowsTable

> `const` **eventMaterializationWindowsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/eventMaterializationWindows.ts:24](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/drizzle/tables/eventMaterializationWindows.ts#L24)

Drizzle ORM postgres table definition for event materialization window configuration.

This table stores configuration settings for the materialization hot window
per organization. It controls how far ahead the background worker should
pre-calculate and store event instances.
