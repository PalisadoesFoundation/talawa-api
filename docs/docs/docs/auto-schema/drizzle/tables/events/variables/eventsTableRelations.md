[Admin Docs](/)

***

# Variable: eventsTableRelations

> `const` **eventsTableRelations**: `Relations`\<`"events"`, \{ `agendaFoldersWhereEvent`: `Many`\<`"agenda_folders"`\>; `attachmentsWhereEvent`: `Many`\<`"event_attachments"`\>; `baseRecurringEvent`: `One`\<`"events"`, `false`\>; `creator`: `One`\<`"users"`, `false`\>; `eventAttendancesWhereEvent`: `Many`\<`"event_attendances"`\>; `exceptionsWhereEventInstance`: `Many`\<`"event_exceptions"`\>; `exceptionsWhereRecurringEvent`: `Many`\<`"event_exceptions"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `recurringEventInstances`: `Many`\<`"events"`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereEvent`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/events.ts:177](https://github.com/gautam-divyanshu/talawa-api/blob/a895c36f24acf725ac16aa7e0f8e50ef9fa64c42/src/drizzle/tables/events.ts#L177)
