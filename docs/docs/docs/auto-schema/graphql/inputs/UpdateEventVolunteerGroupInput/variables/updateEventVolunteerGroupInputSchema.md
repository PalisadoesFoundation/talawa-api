[Admin Docs](/)

***

# Variable: updateEventVolunteerGroupInputSchema

> `const` **updateEventVolunteerGroupInputSchema**: `ZodObject`\<\{ `description`: `ZodOptional`\<`ZodString`\>; `eventId`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; `volunteersRequired`: `ZodOptional`\<`ZodNumber`\>; \}, `"strip"`, `ZodTypeAny`, \{ `description?`: `string`; `eventId`: `string`; `name?`: `string`; `volunteersRequired?`: `number`; \}, \{ `description?`: `string`; `eventId`: `string`; `name?`: `string`; `volunteersRequired?`: `number`; \}\>

Defined in: [src/graphql/inputs/UpdateEventVolunteerGroupInput.ts:8](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/inputs/UpdateEventVolunteerGroupInput.ts#L8)

Zod schema for UpdateEventVolunteerGroupInput validation.
Based on the old Talawa API UpdateEventVolunteerGroupInput structure.
