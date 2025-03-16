[Admin Docs](/)

***

# Variable: venuesTableRelations

> `const` **venuesTableRelations**: `Relations`\<`"venues"`, \{ `attachmentsWhereVenue`: `Many`\<`"venue_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereVenue`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/venues.ts:88](https://github.com/PalisadoesFoundation/talawa-api/blob/37e2d6abe1cabaa02f97a3c6c418b81e8fcb5a13/src/drizzle/tables/venues.ts#L88)
