[Admin Docs](/)

***

# Variable: eventVolunteerGroupInputSchema

> `const` **eventVolunteerGroupInputSchema**: `ZodObject`\<\{ `description`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `eventId`: `ZodString`; `leaderId`: `ZodString`; `name`: `ZodString`; `recurringEventInstanceId`: `ZodOptional`\<`ZodString`\>; `scope`: `ZodOptional`\<`ZodEnum`\<\[`"ENTIRE_SERIES"`, `"THIS_INSTANCE_ONLY"`\]\>\>; `volunteersRequired`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>\>; `volunteerUserIds`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `description?`: `null` \| `string`; `eventId`: `string`; `leaderId`: `string`; `name`: `string`; `recurringEventInstanceId?`: `string`; `scope?`: `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`; `volunteersRequired?`: `null` \| `number`; `volunteerUserIds?`: `string`[]; \}, \{ `description?`: `null` \| `string`; `eventId`: `string`; `leaderId`: `string`; `name`: `string`; `recurringEventInstanceId?`: `string`; `scope?`: `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`; `volunteersRequired?`: `null` \| `number`; `volunteerUserIds?`: `string`[]; \}\>

Defined in: [src/graphql/inputs/EventVolunteerGroupInput.ts:19](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/EventVolunteerGroupInput.ts#L19)

Zod schema for EventVolunteerGroupInput validation.
Based on the old Talawa API EventVolunteerGroupInput structure.
