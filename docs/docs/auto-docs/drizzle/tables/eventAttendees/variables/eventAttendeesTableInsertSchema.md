[**talawa-api**](../../../../README.md)

***

# Variable: eventAttendeesTableInsertSchema

> `const` **eventAttendeesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `checkinTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `checkoutTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `eventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `feedbackSubmitted`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isCheckedIn`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isCheckedOut`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isInvited`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isRegistered`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurringEventInstanceId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `userId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `checkinTime`: `ZodOptional`\<`ZodDate`\>; `checkoutTime`: `ZodOptional`\<`ZodDate`\>; `eventId`: `ZodOptional`\<`ZodString`\>; `feedbackSubmitted`: `ZodOptional`\<`ZodBoolean`\>; `isCheckedIn`: `ZodOptional`\<`ZodBoolean`\>; `isCheckedOut`: `ZodOptional`\<`ZodBoolean`\>; `isInvited`: `ZodOptional`\<`ZodBoolean`\>; `isRegistered`: `ZodOptional`\<`ZodBoolean`\>; `recurringEventInstanceId`: `ZodOptional`\<`ZodString`\>; `userId`: `ZodString`; \}, `undefined`\>

Defined in: [src/drizzle/tables/eventAttendees.ts:232](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/eventAttendees.ts#L232)
