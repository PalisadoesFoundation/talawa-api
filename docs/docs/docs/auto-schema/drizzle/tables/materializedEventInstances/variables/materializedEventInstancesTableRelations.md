[Admin Docs](/)

***

# Variable: materializedEventInstancesTableRelations

> `const` **materializedEventInstancesTableRelations**: `Relations`\<`"materialized_event_instances"`, \{ `attachmentsForMaterializedInstance`: `Many`\<`"event_attachments"`\>; `attendancesForMaterializedInstance`: `Many`\<`"event_attendances"`\>; `baseRecurringEvent`: `One`\<`"events"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `recurrenceRule`: `One`\<`"recurrence_rules"`, `true`\>; `venueBookingsForMaterializedInstance`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/materializedEventInstances.ts:213](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/drizzle/tables/materializedEventInstances.ts#L213)
