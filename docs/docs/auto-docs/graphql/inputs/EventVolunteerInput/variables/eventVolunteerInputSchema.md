[API Docs](/)

***

# Variable: eventVolunteerInputSchema

> `const` **eventVolunteerInputSchema**: `ZodObject`\<\{ `eventId`: `ZodString`; `groupId`: `ZodOptional`\<`ZodString`\>; `recurringEventInstanceId`: `ZodOptional`\<`ZodString`\>; `scope`: `ZodOptional`\<`ZodEnum`\<\[`"ENTIRE_SERIES"`, `"THIS_INSTANCE_ONLY"`\]\>\>; `userId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `eventId`: `string`; `groupId?`: `string`; `recurringEventInstanceId?`: `string`; `scope?`: `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`; `userId`: `string`; \}, \{ `eventId`: `string`; `groupId?`: `string`; `recurringEventInstanceId?`: `string`; `scope?`: `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`; `userId`: `string`; \}\>

Defined in: src/graphql/inputs/EventVolunteerInput.ts:19

Zod schema for EventVolunteerInput validation.
Based on the old Talawa API EventVolunteerInput structure.
