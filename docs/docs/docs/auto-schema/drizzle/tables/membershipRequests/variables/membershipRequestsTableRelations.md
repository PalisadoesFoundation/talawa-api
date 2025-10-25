[Admin Docs](/)

***

# Variable: membershipRequestsTableRelations

> `const` **membershipRequestsTableRelations**: `Relations`\<`"membership_requests"`, \{ `membership`: `One`\<`"organization_memberships"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `user`: `One`\<`"users"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/membershipRequests.ts:73](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/drizzle/tables/membershipRequests.ts#L73)

Relations for membership_requests table.
