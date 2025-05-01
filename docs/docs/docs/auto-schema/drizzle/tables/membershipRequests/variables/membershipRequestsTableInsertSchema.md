[Admin Docs](/)

***

# Variable: membershipRequestsTableInsertSchema

> `const` **membershipRequestsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `membershipRequestId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `organizationId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `status`: `PgColumn`\<\{\}, \{\}, \{\}\>; `userId`: `PgColumn`\<\{\}, \{\}, \{\}\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/membershipRequests.ts:116](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/drizzle/tables/membershipRequests.ts#L116)

Schema for inserting new membership requests.
