[Admin Docs](/)

***

# Variable: membershipRequestsTableRelations

> `const` **membershipRequestsTableRelations**: `Relations`\<`"membership_requests"`, \{ `membership`: `One`\<`"organization_memberships"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `user`: `One`\<`"users"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/membershipRequests.ts:73](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/drizzle/tables/membershipRequests.ts#L73)

Relations for membership_requests table.
