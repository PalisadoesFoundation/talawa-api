[API Docs](/)

***

# Variable: sendEventInvitationsInputSchema

> `const` **sendEventInvitationsInputSchema**: `ZodEffects`\<`ZodObject`\<\{ `emails`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `eventId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `expiresInDays`: `ZodOptional`\<`ZodNumber`\>; `message`: `ZodOptional`\<`ZodString`\>; `recipients`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `email`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `email`: `string`; `name?`: `string`; \}, \{ `email`: `string`; `name?`: `string`; \}\>, `"many"`\>\>; `recurringEventInstanceId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `emails?`: `string`[]; `eventId?`: `null` \| `string`; `expiresInDays?`: `number`; `message?`: `string`; `recipients?`: `object`[]; `recurringEventInstanceId?`: `null` \| `string`; \}, \{ `emails?`: `string`[]; `eventId?`: `null` \| `string`; `expiresInDays?`: `number`; `message?`: `string`; `recipients?`: `object`[]; `recurringEventInstanceId?`: `null` \| `string`; \}\>, \{ `emails?`: `string`[]; `eventId?`: `null` \| `string`; `expiresInDays?`: `number`; `message?`: `string`; `recipients?`: `object`[]; `recurringEventInstanceId?`: `null` \| `string`; \}, \{ `emails?`: `string`[]; `eventId?`: `null` \| `string`; `expiresInDays?`: `number`; `message?`: `string`; `recipients?`: `object`[]; `recurringEventInstanceId?`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/MutationSendEventInvitationsInput.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationSendEventInvitationsInput.ts#L12)
