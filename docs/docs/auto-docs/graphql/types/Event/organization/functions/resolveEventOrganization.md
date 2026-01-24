[**talawa-api**](../../../../../README.md)

***

# Function: resolveEventOrganization()

> **resolveEventOrganization**(`parent`, `_args`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \}\>

Defined in: src/graphql/types/Event/organization.ts:18

Resolves the organization that an event belongs to.

## Parameters

### parent

[`Event`](../../Event/type-aliases/Event.md)

The parent Event object containing the organizationId.

### \_args

`Record`\<`string`, `never`\>

GraphQL arguments (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing dataloaders and logging utilities.

## Returns

`Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \}\>

The organization the event belongs to.

## Throws

TalawaGraphQLError with code "unexpected" if organization is not found (indicates data corruption).
