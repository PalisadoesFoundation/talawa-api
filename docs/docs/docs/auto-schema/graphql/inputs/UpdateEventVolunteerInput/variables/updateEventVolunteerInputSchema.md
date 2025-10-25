[Admin Docs](/)

***

# Variable: updateEventVolunteerInputSchema

> `const` **updateEventVolunteerInputSchema**: `ZodObject`\<\{ `assignments`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `hasAccepted`: `ZodOptional`\<`ZodBoolean`\>; `isPublic`: `ZodOptional`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `assignments?`: `string`[]; `hasAccepted?`: `boolean`; `isPublic?`: `boolean`; \}, \{ `assignments?`: `string`[]; `hasAccepted?`: `boolean`; `isPublic?`: `boolean`; \}\>

Defined in: [src/graphql/inputs/UpdateEventVolunteerInput.ts:8](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/UpdateEventVolunteerInput.ts#L8)

Zod schema for UpdateEventVolunteerInput validation.
Based on the old Talawa API UpdateEventVolunteerInput structure.
