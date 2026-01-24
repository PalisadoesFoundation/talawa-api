[**talawa-api**](../../../../../README.md)

***

# Function: resolveOrganization()

> **resolveOrganization**(`parent`, `_args`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \}\>

Defined in: src/graphql/types/Fund/organization.ts:16

Resolves the organization that a fund belongs to.

## Parameters

### parent

The parent Fund object containing the organizationId.

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### id

`string`

#### isArchived

`boolean`

#### isDefault

`boolean`

#### isTaxDeductible

`boolean`

#### name

`string`

#### organizationId

`string`

#### referenceNumber

`string` \| `null`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

### \_args

`Record`\<`string`, `never`\>

GraphQL arguments (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing dataloaders and logging utilities.

## Returns

`Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \}\>

The organization the fund belongs to.

## Throws

TalawaGraphQLError with code "unexpected" if organization is not found (indicates data corruption).
