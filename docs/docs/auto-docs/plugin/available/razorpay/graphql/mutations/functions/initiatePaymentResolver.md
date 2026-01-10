[API Docs](/)

***

# Function: initiatePaymentResolver()

> **initiatePaymentResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `amount`: `number` \| `undefined`; `currency`: `string`; `message`: `string`; `orderId`: `string`; `paymentId`: `string`; `success`: `boolean`; `transaction`: \{ `amount`: `number` \| `undefined`; `currency`: `string`; `paymentId`: `string`; `status`: `string`; \}; \} \| \{ `amount?`: `undefined`; `currency?`: `undefined`; `message`: `string`; `orderId?`: `undefined`; `paymentId?`: `undefined`; `success`: `boolean`; `transaction`: `null`; \}\>

Defined in: src/plugin/available/razorpay/graphql/mutations.ts:267

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `customerDetails?`: \{ `contact`: `string`; `email`: `string`; `name`: `string`; \} \| `null`; `orderId`: `string`; `paymentMethod`: `string`; \} = `razorpayPaymentInputSchema`

#### input.customerDetails?

\{ `contact`: `string`; `email`: `string`; `name`: `string`; \} \| `null` = `...`

#### input.orderId

`string` = `...`

#### input.paymentMethod

`string` = `...`

### ctx

[`GraphQLContext`](../../../../../../graphql/context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `amount`: `number` \| `undefined`; `currency`: `string`; `message`: `string`; `orderId`: `string`; `paymentId`: `string`; `success`: `boolean`; `transaction`: \{ `amount`: `number` \| `undefined`; `currency`: `string`; `paymentId`: `string`; `status`: `string`; \}; \} \| \{ `amount?`: `undefined`; `currency?`: `undefined`; `message`: `string`; `orderId?`: `undefined`; `paymentId?`: `undefined`; `success`: `boolean`; `transaction`: `null`; \}\>
