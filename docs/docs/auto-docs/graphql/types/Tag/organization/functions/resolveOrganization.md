[API Docs](/)

***

# Function: resolveOrganization()

> **resolveOrganization**(`parent`, `_args`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \}\>

Defined in: [src/graphql/types/Tag/organization.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Tag/organization.ts#L20)

Resolves the organization that a tag belongs to.

This resolver uses DataLoader for batched organization lookups.
Authentication and authorization are handled by the parent Query.tag resolver.

## Parameters

### parent

The parent Tag object containing the organizationId.

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### folderId

`string` \| `null`

#### id

`string`

#### name

`string`

#### organizationId

`string`

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

The organization the tag belongs to.

## Throws

TalawaGraphQLError with code "unexpected" if organization is not found (indicates data corruption).
