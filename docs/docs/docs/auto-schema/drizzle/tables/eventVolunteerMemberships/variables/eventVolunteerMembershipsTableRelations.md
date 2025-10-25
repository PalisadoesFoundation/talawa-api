[Admin Docs](/)

***

# Variable: eventVolunteerMembershipsTableRelations

> `const` **eventVolunteerMembershipsTableRelations**: `Relations`\<`"event_volunteer_memberships"`, \{ `createdByUser`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `group`: `One`\<`"event_volunteer_groups"`, `false`\>; `updatedByUser`: `One`\<`"users"`, `false`\>; `volunteer`: `One`\<`"event_volunteers"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/eventVolunteerMemberships.ts:123](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/drizzle/tables/eventVolunteerMemberships.ts#L123)
