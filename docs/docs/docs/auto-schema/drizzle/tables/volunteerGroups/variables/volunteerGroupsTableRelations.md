[Admin Docs](/)

***

# Variable: volunteerGroupsTableRelations

> `const` **volunteerGroupsTableRelations**: `Relations`\<`"volunteer_groups"`, \{ `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `leader`: `One`\<`"users"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; `volunteerGroupAssignmentsWhereGroup`: `Many`\<`"volunteer_group_assignments"`\>; \}\>

Defined in: [src/drizzle/tables/volunteerGroups.ts:74](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/drizzle/tables/volunteerGroups.ts#L74)
