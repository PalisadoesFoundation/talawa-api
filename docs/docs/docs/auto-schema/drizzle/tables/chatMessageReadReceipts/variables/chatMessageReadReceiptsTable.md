[Admin Docs](/)

***

# Variable: chatMessageReadReceiptsTable

> `const` **chatMessageReadReceiptsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/chatMessageReadReceipts.ts:17](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/drizzle/tables/chatMessageReadReceipts.ts#L17)

Drizzle orm postgres table definition for per-message read receipts.
Composite primary key ensures one receipt per (message, reader).
