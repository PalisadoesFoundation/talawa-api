[Admin Docs](/)

***

# Variable: membershipRequestsTableInsertSchema

> `const` **membershipRequestsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `membershipRequestId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `organizationId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `status`: `PgColumn`\<\{\}, \{\}, \{\}\>; `userId`: `PgColumn`\<\{\}, \{\}, \{\}\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/membershipRequests.ts:116](https://github.com/hustlernik/talawa-api/blob/6321c91e956d2ee44b2bb9c22c1b40aa4687c9c2/src/drizzle/tables/membershipRequests.ts#L116)

Schema for inserting new membership requests.
