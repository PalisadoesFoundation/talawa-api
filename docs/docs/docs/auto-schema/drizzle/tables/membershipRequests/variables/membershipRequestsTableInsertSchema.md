[Admin Docs](/)

***

# Variable: membershipRequestsTableInsertSchema

> `const` **membershipRequestsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `membershipRequestId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `status`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `userId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/membershipRequests.ts:116](https://github.com/PalisadoesFoundation/talawa-api/blob/a4f57b3a64e82c74809b195eb7bde9c04b2a5e89/src/drizzle/tables/membershipRequests.ts#L116)

Schema for inserting new membership requests.
