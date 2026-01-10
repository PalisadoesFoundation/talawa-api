[API Docs](/)

***

# Function: updateRazorpayConfigResolver()

> **updateRazorpayConfigResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `currency`: `string`; `description`: `string`; `isEnabled`: `boolean`; `keyId`: `string` \| `undefined`; `keySecret`: `string` \| `undefined`; `testMode`: `true`; `webhookSecret`: `string` \| `undefined`; \}\>

Defined in: src/plugin/available/razorpay/graphql/mutations.ts:35

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `currency`: `string`; `description`: `string`; `isEnabled`: `boolean`; `keyId?`: `string` \| `null`; `keySecret?`: `string` \| `null`; `testMode`: `boolean`; `webhookSecret?`: `string` \| `null`; \} = `razorpayConfigInputSchema`

#### input.currency

`string` = `...`

#### input.description

`string` = `...`

#### input.isEnabled

`boolean` = `...`

#### input.keyId?

`string` \| `null` = `...`

#### input.keySecret?

`string` \| `null` = `...`

#### input.testMode

`boolean` = `...`

#### input.webhookSecret?

`string` \| `null` = `...`

### ctx

[`GraphQLContext`](../../../../../../graphql/context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `currency`: `string`; `description`: `string`; `isEnabled`: `boolean`; `keyId`: `string` \| `undefined`; `keySecret`: `string` \| `undefined`; `testMode`: `true`; `webhookSecret`: `string` \| `undefined`; \}\>
