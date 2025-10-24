[Admin Docs](/)

***

# Variable: venuesTableRelations

> `const` **venuesTableRelations**: `Relations`\<`"venues"`, \{ `attachmentsWhereVenue`: `Many`\<`"venue_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereVenue`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/venues.ts:93](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/drizzle/tables/venues.ts#L93)
