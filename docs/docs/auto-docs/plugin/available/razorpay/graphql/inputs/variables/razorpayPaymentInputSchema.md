[API Docs](/)

***

# Variable: razorpayPaymentInputSchema

> `const` **razorpayPaymentInputSchema**: `ZodObject`\<\{ `customerDetails`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `contact`: `ZodString`; `email`: `ZodString`; `name`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `contact`: `string`; `email`: `string`; `name`: `string`; \}, \{ `contact`: `string`; `email`: `string`; `name`: `string`; \}\>\>\>; `orderId`: `ZodString`; `paymentMethod`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `customerDetails?`: \{ `contact`: `string`; `email`: `string`; `name`: `string`; \} \| `null`; `orderId`: `string`; `paymentMethod`: `string`; \}, \{ `customerDetails?`: \{ `contact`: `string`; `email`: `string`; `name`: `string`; \} \| `null`; `orderId`: `string`; `paymentMethod`: `string`; \}\>

Defined in: src/plugin/available/razorpay/graphql/inputs.ts:59
