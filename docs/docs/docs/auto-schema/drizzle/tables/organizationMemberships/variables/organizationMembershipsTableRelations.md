[Admin Docs](/)

***

# Variable: organizationMembershipsTableRelations

> `const` **organizationMembershipsTableRelations**: `Relations`\<`"organization_memberships"`, \{ `creator`: `One`\<`"users"`, `false`\>; `member`: `One`\<`"users"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/organizationMemberships.ts:92](https://github.com/hustlernik/talawa-api/blob/6321c91e956d2ee44b2bb9c22c1b40aa4687c9c2/src/drizzle/tables/organizationMemberships.ts#L92)
