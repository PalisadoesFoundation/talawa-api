[Admin Docs](/)

***

# Variable: eventsTableRelations

> `const` **eventsTableRelations**: `Relations`\<`"events"`, \{ `agendaFoldersWhereEvent`: `Many`\<`"agenda_folders"`\>; `attachmentsWhereEvent`: `Many`\<`"event_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `eventAttendancesWhereEvent`: `Many`\<`"event_attendances"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereEvent`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/events.ts:100](https://github.com/PratapRathi/talawa-api/blob/72aae1e3507e4dd8ad32a69696c05d569e0ed095/src/drizzle/tables/events.ts#L100)
