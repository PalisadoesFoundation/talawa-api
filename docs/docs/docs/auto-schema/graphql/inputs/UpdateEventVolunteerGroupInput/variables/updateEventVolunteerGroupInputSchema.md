[Admin Docs](/)

***

# Variable: updateEventVolunteerGroupInputSchema

> `const` **updateEventVolunteerGroupInputSchema**: `ZodObject`\<\{ `description`: `ZodOptional`\<`ZodString`\>; `eventId`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; `volunteersRequired`: `ZodOptional`\<`ZodNumber`\>; \}, `"strip"`, `ZodTypeAny`, \{ `description?`: `string`; `eventId`: `string`; `name?`: `string`; `volunteersRequired?`: `number`; \}, \{ `description?`: `string`; `eventId`: `string`; `name?`: `string`; `volunteersRequired?`: `number`; \}\>

Defined in: [src/graphql/inputs/UpdateEventVolunteerGroupInput.ts:8](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/graphql/inputs/UpdateEventVolunteerGroupInput.ts#L8)

Zod schema for UpdateEventVolunteerGroupInput validation.
Based on the old Talawa API UpdateEventVolunteerGroupInput structure.
