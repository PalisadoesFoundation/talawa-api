[Admin Docs](/)

***

# Variable: organizationMembershipsTableRelations

> `const` **organizationMembershipsTableRelations**: `Relations`\<`"organization_memberships"`, \{ `creator`: `One`\<`"users"`, `false`\>; `member`: `One`\<`"users"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/organizationMemberships.ts:92](https://github.com/PalisadoesFoundation/talawa-api/blob/1251c45d69620e1317cb8632c6decbdb7edbdb06/src/drizzle/tables/organizationMemberships.ts#L92)
