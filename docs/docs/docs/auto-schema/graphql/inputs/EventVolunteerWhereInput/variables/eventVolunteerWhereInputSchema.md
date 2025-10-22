[Admin Docs](/)

***

# Variable: eventVolunteerWhereInputSchema

> `const` **eventVolunteerWhereInputSchema**: `ZodObject`\<\{ `eventId`: `ZodOptional`\<`ZodString`\>; `groupId`: `ZodOptional`\<`ZodString`\>; `hasAccepted`: `ZodOptional`\<`ZodBoolean`\>; `id`: `ZodOptional`\<`ZodString`\>; `name_contains`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `eventId?`: `string`; `groupId?`: `string`; `hasAccepted?`: `boolean`; `id?`: `string`; `name_contains?`: `string`; \}, \{ `eventId?`: `string`; `groupId?`: `string`; `hasAccepted?`: `boolean`; `id?`: `string`; `name_contains?`: `string`; \}\>

Defined in: [src/graphql/inputs/EventVolunteerWhereInput.ts:8](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/inputs/EventVolunteerWhereInput.ts#L8)

Zod schema for EventVolunteerWhereInput validation.
Based on the old Talawa API EventVolunteerWhereInput structure.
