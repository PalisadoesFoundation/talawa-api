[**talawa-api**](../../../../README.md)

***

# Variable: eventInvitationsTable

> `const` **eventInvitationsTable**: `PgTableWithColumns`\<\{ \}\>

Defined in: [src/drizzle/tables/eventInvitations.ts:23](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/eventInvitations.ts#L23)

Table to store event invitations for both users and non-users.
Invitations are created with an email and a secure token. When
the recipient accepts the invitation the `userId` can be linked
and an `event_attendees` record should be created by service logic.
