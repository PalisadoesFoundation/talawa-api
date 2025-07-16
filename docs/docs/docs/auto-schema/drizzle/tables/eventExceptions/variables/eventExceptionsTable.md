[Admin Docs](/)

***

# Variable: eventExceptionsTable

> `const` **eventExceptionsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/eventExceptions.ts:31](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/drizzle/tables/eventExceptions.ts#L31)

Drizzle ORM postgres table definition for event exceptions.
This table stores instance-specific modifications to recurring events.
When a user modifies a single instance or "this and future" instances,
the changes are stored here as differences from the template.
