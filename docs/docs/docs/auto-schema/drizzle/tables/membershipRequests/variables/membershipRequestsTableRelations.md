[Admin Docs](/)

***

# Variable: membershipRequestsTableRelations

> `const` **membershipRequestsTableRelations**: `Relations`\<`"membership_requests"`, \{ `membership`: `One`\<`"organization_memberships"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `user`: `One`\<`"users"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/membershipRequests.ts:73](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/drizzle/tables/membershipRequests.ts#L73)

Relations for membership_requests table.
