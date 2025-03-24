[Admin Docs](/)

***

# Variable: volunteerGroupsTableRelations

> `const` **volunteerGroupsTableRelations**: `Relations`\<`"volunteer_groups"`, \{ `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `leader`: `One`\<`"users"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; `volunteerGroupAssignmentsWhereGroup`: `Many`\<`"volunteer_group_assignments"`\>; \}\>

Defined in: [src/drizzle/tables/volunteerGroups.ts:73](https://github.com/NishantSinghhhhh/talawa-api/blob/502aef4080ad9777c9b76e051d199e7a956ceecc/src/drizzle/tables/volunteerGroups.ts#L73)
