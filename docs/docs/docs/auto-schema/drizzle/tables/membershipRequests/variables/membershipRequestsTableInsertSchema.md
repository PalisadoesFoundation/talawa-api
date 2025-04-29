[Admin Docs](/)

***

# Variable: membershipRequestsTableInsertSchema

> `const` **membershipRequestsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `membershipRequestId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `organizationId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `status`: `PgColumn`\<\{\}, \{\}, \{\}\>; `userId`: `PgColumn`\<\{\}, \{\}, \{\}\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/membershipRequests.ts:116](https://github.com/PalisadoesFoundation/talawa-api/blob/b92360e799fdc7cf89a1346eb8395735c501ee9c/src/drizzle/tables/membershipRequests.ts#L116)

Schema for inserting new membership requests.
