[Admin Docs](/)

***

# Variable: materializedEventInstancesTableRelations

> `const` **materializedEventInstancesTableRelations**: `Relations`\<`"materialized_event_instances"`, \{ `attachmentsForMaterializedInstance`: `Many`\<`"event_attachments"`\>; `attendancesForMaterializedInstance`: `Many`\<`"event_attendances"`\>; `baseRecurringEvent`: `One`\<`"events"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `recurrenceRule`: `One`\<`"recurrence_rules"`, `true`\>; `venueBookingsForMaterializedInstance`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/materializedEventInstances.ts:213](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/drizzle/tables/materializedEventInstances.ts#L213)
