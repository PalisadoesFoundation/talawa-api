[Admin Docs](/)

***

# Variable: venuesTableRelations

> `const` **venuesTableRelations**: `Relations`\<`"venues"`, \{ `attachmentsWhereVenue`: `Many`\<`"venue_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereVenue`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/venues.ts:93](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/drizzle/tables/venues.ts#L93)
