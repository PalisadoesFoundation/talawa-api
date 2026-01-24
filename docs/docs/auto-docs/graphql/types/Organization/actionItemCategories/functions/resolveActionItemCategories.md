[**talawa-api**](../../../../../README.md)

***

# Function: resolveActionItemCategories()

> **resolveActionItemCategories**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/graphqlConnection/types/type-aliases/DefaultGraphQLConnection.md)\<\{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `isDisabled`: `boolean`; `name`: `string`; `organizationId`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>\>

Defined in: [src/graphql/types/Organization/actionItemCategories.ts:56](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/types/Organization/actionItemCategories.ts#L56)

## Parameters

### parent

#### addressLine1

`string` \| `null`

#### addressLine2

`string` \| `null`

#### avatarMimeType

`string` \| `null`

#### avatarName

`string` \| `null`

#### city

`string` \| `null`

#### countryCode

`string` \| `null`

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### description

`string` \| `null`

#### id

`string`

#### name

`string`

#### postalCode

`string` \| `null`

#### state

`string` \| `null`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

#### userRegistrationRequired

`boolean` \| `null`

### args

#### after?

`string` \| `null` = `...`

#### before?

`string` \| `null` = `...`

#### first?

`number` \| `null` = `...`

#### last?

`number` \| `null` = `...`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/graphqlConnection/types/type-aliases/DefaultGraphQLConnection.md)\<\{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `isDisabled`: `boolean`; `name`: `string`; `organizationId`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>\>
