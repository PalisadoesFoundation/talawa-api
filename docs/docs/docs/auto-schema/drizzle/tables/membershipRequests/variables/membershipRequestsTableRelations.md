[Admin Docs](/)

***

# Variable: membershipRequestsTableRelations

> `const` **membershipRequestsTableRelations**: `Relations`\<`"membership_requests"`, \{ `membership`: `One`\<`"organization_memberships"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `user`: `One`\<`"users"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/membershipRequests.ts:73](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/drizzle/tables/membershipRequests.ts#L73)

Relations for membership_requests table.
