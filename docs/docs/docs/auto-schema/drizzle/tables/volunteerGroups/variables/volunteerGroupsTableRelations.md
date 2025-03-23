[Admin Docs](/)

***

# Variable: volunteerGroupsTableRelations

> `const` **volunteerGroupsTableRelations**: `Relations`\<`"volunteer_groups"`, \{ `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `leader`: `One`\<`"users"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; `volunteerGroupAssignmentsWhereGroup`: `Many`\<`"volunteer_group_assignments"`\>; \}\>

Defined in: [src/drizzle/tables/volunteerGroups.ts:73](https://github.com/NishantSinghhhhh/talawa-api/blob/80d33ad4356836957a519774ac35d2e1e92179d5/src/drizzle/tables/volunteerGroups.ts#L73)
