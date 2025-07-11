[Admin Docs](/)

***

# Variable: eventsTableRelations

> `const` **eventsTableRelations**: `Relations`\<`"events"`, \{ `agendaFoldersWhereEvent`: `Many`\<`"agenda_folders"`\>; `attachmentsWhereEvent`: `Many`\<`"event_attachments"`\>; `baseRecurringEvent`: `One`\<`"events"`, `false`\>; `creator`: `One`\<`"users"`, `false`\>; `eventAttendancesWhereEvent`: `Many`\<`"event_attendances"`\>; `exceptionsWhereEventInstance`: `Many`\<`"event_exceptions"`\>; `exceptionsWhereRecurringEvent`: `Many`\<`"event_exceptions"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `recurringEventInstances`: `Many`\<`"events"`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereEvent`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/events.ts:177](https://github.com/gautam-divyanshu/talawa-api/blob/441b833d91882cfef7272c118419933afe47f7b6/src/drizzle/tables/events.ts#L177)
