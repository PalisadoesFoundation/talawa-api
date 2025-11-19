[API Docs](/)

***

# Variable: sendEventInvitationsInputSchema

> `const` **sendEventInvitationsInputSchema**: `ZodEffects`\<`ZodObject`\<\{ `emails`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `eventId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `expiresInDays`: `ZodOptional`\<`ZodNumber`\>; `message`: `ZodOptional`\<`ZodString`\>; `recipients`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `email`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `email`: `string`; `name?`: `string`; \}, \{ `email`: `string`; `name?`: `string`; \}\>, `"many"`\>\>; `recurringEventInstanceId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `emails?`: `string`[]; `eventId?`: `string` \| `null`; `expiresInDays?`: `number`; `message?`: `string`; `recipients?`: `object`[]; `recurringEventInstanceId?`: `string` \| `null`; \}, \{ `emails?`: `string`[]; `eventId?`: `string` \| `null`; `expiresInDays?`: `number`; `message?`: `string`; `recipients?`: `object`[]; `recurringEventInstanceId?`: `string` \| `null`; \}\>, \{ `emails?`: `string`[]; `eventId?`: `string` \| `null`; `expiresInDays?`: `number`; `message?`: `string`; `recipients?`: `object`[]; `recurringEventInstanceId?`: `string` \| `null`; \}, \{ `emails?`: `string`[]; `eventId?`: `string` \| `null`; `expiresInDays?`: `number`; `message?`: `string`; `recipients?`: `object`[]; `recurringEventInstanceId?`: `string` \| `null`; \}\>

Defined in: src/graphql/inputs/MutationSendEventInvitationsInput.ts:12
