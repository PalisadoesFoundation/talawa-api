[Admin Docs](/)

***

# Variable: membershipRequestsTableRelations

> `const` **membershipRequestsTableRelations**: `Relations`\<`"membership_requests"`, \{ `membership`: `One`\<`"organization_memberships"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `user`: `One`\<`"users"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/membershipRequests.ts:73](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/drizzle/tables/membershipRequests.ts#L73)

Relations for membership_requests table.
