[Admin Docs](/)

***

# Variable: eventVolunteerWhereInputSchema

> `const` **eventVolunteerWhereInputSchema**: `ZodObject`\<\{ `eventId`: `ZodOptional`\<`ZodString`\>; `groupId`: `ZodOptional`\<`ZodString`\>; `hasAccepted`: `ZodOptional`\<`ZodBoolean`\>; `id`: `ZodOptional`\<`ZodString`\>; `name_contains`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `eventId?`: `string`; `groupId?`: `string`; `hasAccepted?`: `boolean`; `id?`: `string`; `name_contains?`: `string`; \}, \{ `eventId?`: `string`; `groupId?`: `string`; `hasAccepted?`: `boolean`; `id?`: `string`; `name_contains?`: `string`; \}\>

Defined in: [src/graphql/inputs/EventVolunteerWhereInput.ts:8](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/graphql/inputs/EventVolunteerWhereInput.ts#L8)

Zod schema for EventVolunteerWhereInput validation.
Based on the old Talawa API EventVolunteerWhereInput structure.
