[**talawa-api**](../../../../README.md)

***

# Variable: chatMessageReadReceiptsTable

> `const` **chatMessageReadReceiptsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: src/drizzle/tables/chatMessageReadReceipts.ts:17

Drizzle orm postgres table definition for per-message read receipts.
Composite primary key ensures one receipt per (message, reader).
