[**talawa-api**](../../../../../README.md)

***

# Function: updatedAtResolver()

> **updatedAtResolver**(`parent`, `_args`, `ctx`): `Promise`\<`Date` \| `null`\>

Defined in: [src/graphql/types/FundCampaign/updatedAt.ts:23](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/types/FundCampaign/updatedAt.ts#L23)

Resolver for the updatedAt field of FundCampaign type.
Validates user authentication and authorization before returning the last update timestamp.
Only administrators and organization admins have access to this field.

## Parameters

### parent

The parent FundCampaign object containing the updatedAt field

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

GraphQL context containing authentication and database clients

## Returns

`Promise`\<`Date` \| `null`\>

Promise<Date> The timestamp when the fund campaign was last updated

## Throws

TalawaGraphQLError With code 'unauthenticated' if user is not logged in

## Throws

TalawaGraphQLError With code 'unauthorized_action' if user lacks required permissions

## Throws

TalawaGraphQLError With code 'unexpected' for database or other runtime errors
