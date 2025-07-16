[Admin Docs](/)

***

# Variable: volunteerGroupsTableRelations

> `const` **volunteerGroupsTableRelations**: `Relations`\<`"volunteer_groups"`, \{ `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `leader`: `One`\<`"users"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; `volunteerGroupAssignmentsWhereGroup`: `Many`\<`"volunteer_group_assignments"`\>; \}\>

Defined in: [src/drizzle/tables/volunteerGroups.ts:74](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/drizzle/tables/volunteerGroups.ts#L74)
