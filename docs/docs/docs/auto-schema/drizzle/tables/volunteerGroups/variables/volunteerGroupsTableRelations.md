[Admin Docs](/)

***

# Variable: volunteerGroupsTableRelations

> `const` **volunteerGroupsTableRelations**: `Relations`\<`"volunteer_groups"`, \{ `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `leader`: `One`\<`"users"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; `volunteerGroupAssignmentsWhereGroup`: `Many`\<`"volunteer_group_assignments"`\>; \}\>

Defined in: [src/drizzle/tables/volunteerGroups.ts:73](https://github.com/NishantSinghhhhh/talawa-api/blob/d7e8fb10f99b66342acb17768b9755553b21ad54/src/drizzle/tables/volunteerGroups.ts#L73)
