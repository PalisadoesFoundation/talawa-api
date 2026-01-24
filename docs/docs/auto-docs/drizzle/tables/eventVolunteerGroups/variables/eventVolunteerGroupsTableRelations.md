[**talawa-api**](../../../../README.md)

***

# Variable: eventVolunteerGroupsTableRelations

> `const` **eventVolunteerGroupsTableRelations**: `Relations`\<`"event_volunteer_groups"`, \{ `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `leader`: `One`\<`"users"`, `true`\>; `recurringEventInstance`: `One`\<`"recurring_event_instances"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; `volunteerMemberships`: `Many`\<`"event_volunteer_memberships"`\>; \}\>

Defined in: [src/drizzle/tables/eventVolunteerGroups.ts:131](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/eventVolunteerGroups.ts#L131)
