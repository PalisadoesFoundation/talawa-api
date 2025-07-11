[Admin Docs](/)

***

# Variable: venuesTableRelations

> `const` **venuesTableRelations**: `Relations`\<`"venues"`, \{ `attachmentsWhereVenue`: `Many`\<`"venue_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `venueBookingsWhereVenue`: `Many`\<`"venue_bookings"`\>; \}\>

Defined in: [src/drizzle/tables/venues.ts:88](https://github.com/gautam-divyanshu/talawa-api/blob/a895c36f24acf725ac16aa7e0f8e50ef9fa64c42/src/drizzle/tables/venues.ts#L88)
