[Admin Docs](/)

***

# Variable: eventsTableRelations

> `const` **eventsTableRelations**: `Relations`\<`"events"`, \{ `agendaFoldersWhereEvent`: `Many`\<`"agenda_folders"`\>; `attachmentsWhereEvent`: `Many`\<`"event_attachments"`\>; `baseRecurringEvent`: `One`\<`"events"`, `false`\>; `creator`: `One`\<`"users"`, `false`\>; `eventAttendancesWhereEvent`: `Many`\<`"event_attendances"`\>; `exceptionsWhereEventInstance`: `Many`\<`"event_exceptions"`\>; `exceptionsWhereRecurringEvent`: `Many`\<`"event_exceptions"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `recurringEventInstances`: `Many`\<`"events"`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereEvent`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/events.ts:177](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/drizzle/tables/events.ts#L177)
