[API Docs](/)

***

# Function: fundCampaignFundResolver()

> **fundCampaignFundResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `id`: `string`; `isArchived`: `boolean`; `isDefault`: `boolean`; `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; `referenceNumber`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

Defined in: [src/graphql/types/FundCampaign/fund.ts:7](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/FundCampaign/fund.ts#L7)

## Parameters

### parent

#### amountRaised

`number`

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### currencyCode

`string`

#### endAt

`Date`

#### fundId

`string`

#### goalAmount

`number`

#### id

`string`

#### name

`string`

#### startAt

`Date`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `id`: `string`; `isArchived`: `boolean`; `isDefault`: `boolean`; `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; `referenceNumber`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>
