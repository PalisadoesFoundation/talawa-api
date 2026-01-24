[**talawa-api**](../../../../../../README.md)

***

# Function: getUserTransactionStatsResolver()

> **getUserTransactionStatsResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `currency`: `string`; `failedCount`: `number`; `pendingCount`: `number`; `successCount`: `number`; `totalAmount`: `number`; `totalTransactions`: `number`; \}\>

Defined in: src/plugin/available/razorpay/graphql/queries.ts:409

## Parameters

### \_parent

`unknown`

### args

#### dateFrom?

`string` \| `null` = `...`

#### dateTo?

`string` \| `null` = `...`

#### userId

`string` = `...`

### ctx

[`GraphQLContext`](../../../../../../graphql/context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `currency`: `string`; `failedCount`: `number`; `pendingCount`: `number`; `successCount`: `number`; `totalAmount`: `number`; `totalTransactions`: `number`; \}\>
