[Admin Docs](/)

***

# Variable: venuesTableRelations

> `const` **venuesTableRelations**: `Relations`\<`"venues"`, \{ `attachmentsWhereVenue`: `Many`\<`"venue_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereVenue`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/venues.ts:88](https://github.com/PratapRathi/talawa-api/blob/8547a42c99c7a44be459745d0018a2deccfb1f66/src/drizzle/tables/venues.ts#L88)
