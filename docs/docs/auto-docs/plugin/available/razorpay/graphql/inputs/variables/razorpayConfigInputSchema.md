[API Docs](/)

***

# Variable: razorpayConfigInputSchema

> `const` **razorpayConfigInputSchema**: `ZodObject`\<\{ `currency`: `ZodString`; `description`: `ZodString`; `isEnabled`: `ZodBoolean`; `keyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `keySecret`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `testMode`: `ZodBoolean`; `webhookSecret`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `currency`: `string`; `description`: `string`; `isEnabled`: `boolean`; `keyId?`: `string` \| `null`; `keySecret?`: `string` \| `null`; `testMode`: `boolean`; `webhookSecret?`: `string` \| `null`; \}, \{ `currency`: `string`; `description`: `string`; `isEnabled`: `boolean`; `keyId?`: `string` \| `null`; `keySecret?`: `string` \| `null`; `testMode`: `boolean`; `webhookSecret?`: `string` \| `null`; \}\>

Defined in: src/plugin/available/razorpay/graphql/inputs.ts:5
