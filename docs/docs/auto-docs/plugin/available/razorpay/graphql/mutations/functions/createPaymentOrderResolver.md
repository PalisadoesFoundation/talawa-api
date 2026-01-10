[API Docs](/)

***

# Function: createPaymentOrderResolver()

> **createPaymentOrderResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `amount`: `number` \| `null`; `anonymous`: `any`; `createdAt`: `Date` \| `null`; `currency`: `string` \| `null`; `description`: `string` \| `null`; `donorEmail`: `string` \| `null`; `donorName`: `string` \| `null`; `donorPhone`: `string` \| `null`; `id`: `string`; `organizationId`: `string` \| `null`; `razorpayOrderId`: `string` \| `null`; `status`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `userId`: `string` \| `null`; \}\>

Defined in: src/plugin/available/razorpay/graphql/mutations.ts:156

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `amount`: `number`; `currency`: `string`; `description?`: `string` \| `null`; `donorEmail?`: `string` \| `null`; `donorName?`: `string` \| `null`; `donorPhone?`: `string` \| `null`; `organizationId?`: `string` \| `null`; `userId?`: `string` \| `null`; \} = `razorpayOrderInputSchema`

#### input.amount

`number` = `...`

#### input.currency

`string` = `...`

#### input.description?

`string` \| `null` = `...`

#### input.donorEmail?

`string` \| `null` = `...`

#### input.donorName?

`string` \| `null` = `...`

#### input.donorPhone?

`string` \| `null` = `...`

#### input.organizationId?

`string` \| `null` = `...`

#### input.userId?

`string` \| `null` = `...`

### ctx

[`GraphQLContext`](../../../../../../graphql/context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `amount`: `number` \| `null`; `anonymous`: `any`; `createdAt`: `Date` \| `null`; `currency`: `string` \| `null`; `description`: `string` \| `null`; `donorEmail`: `string` \| `null`; `donorName`: `string` \| `null`; `donorPhone`: `string` \| `null`; `id`: `string`; `organizationId`: `string` \| `null`; `razorpayOrderId`: `string` \| `null`; `status`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `userId`: `string` \| `null`; \}\>
