[Admin Docs](/)

***

# Variable: membershipRequestsTableInsertSchema

> `const` **membershipRequestsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `membershipRequestId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `organizationId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `status`: `PgColumn`\<\{\}, \{\}, \{\}\>; `userId`: `PgColumn`\<\{\}, \{\}, \{\}\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/membershipRequests.ts:116](https://github.com/PalisadoesFoundation/talawa-api/blob/04adcbca27f07ca5c0bffce211b6e6b77a1828ce/src/drizzle/tables/membershipRequests.ts#L116)

Schema for inserting new membership requests.
