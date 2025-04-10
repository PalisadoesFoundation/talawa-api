[Admin Docs](/)

***

# Variable: membershipRequestsTableRelations

> `const` **membershipRequestsTableRelations**: `Relations`\<`"membership_requests"`, \{ `membership`: `One`\<`"organization_memberships"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `user`: `One`\<`"users"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/membershipRequests.ts:73](https://github.com/PurnenduMIshra129th/talawa-api/blob/86f70716c91247c1756c784fed3bccb85b1ded8e/src/drizzle/tables/membershipRequests.ts#L73)

Relations for membership_requests table.
