[Admin Docs](/)

***

# Variable: eventVolunteerGroupsTableRelations

> `const` **eventVolunteerGroupsTableRelations**: `Relations`\<`"event_volunteer_groups"`, \{ `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `leader`: `One`\<`"users"`, `true`\>; `recurringEventInstance`: `One`\<`"recurring_event_instances"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; `volunteerMemberships`: `Many`\<`"event_volunteer_memberships"`\>; \}\>

Defined in: [src/drizzle/tables/eventVolunteerGroups.ts:131](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/drizzle/tables/eventVolunteerGroups.ts#L131)
