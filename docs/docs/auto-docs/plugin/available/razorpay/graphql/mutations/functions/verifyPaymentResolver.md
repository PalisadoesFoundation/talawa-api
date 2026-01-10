[API Docs](/)

***

# Function: verifyPaymentResolver()

> **verifyPaymentResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `message`: `string`; `success`: `boolean`; `transaction`: \{ `amount`: `number` \| `undefined`; `currency`: `string`; `paymentId`: `string`; `status`: `string`; \}; \} \| \{ `message`: `string`; `success`: `boolean`; `transaction`: `null`; \}\>

Defined in: src/plugin/available/razorpay/graphql/mutations.ts:393

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `paymentData`: `string`; `razorpayOrderId`: `string`; `razorpayPaymentId`: `string`; `razorpaySignature`: `string`; \} = `razorpayVerificationInputSchema`

#### input.paymentData

`string` = `...`

#### input.razorpayOrderId

`string` = `...`

#### input.razorpayPaymentId

`string` = `...`

#### input.razorpaySignature

`string` = `...`

### ctx

[`GraphQLContext`](../../../../../../graphql/context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `message`: `string`; `success`: `boolean`; `transaction`: \{ `amount`: `number` \| `undefined`; `currency`: `string`; `paymentId`: `string`; `status`: `string`; \}; \} \| \{ `message`: `string`; `success`: `boolean`; `transaction`: `null`; \}\>
