[**talawa-api**](../../../../../README.md)

***

# Function: tagCreatorResolver()

> **tagCreatorResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `string` \| `null`; `emailAddress`: `string`; `employmentStatus`: `string` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `string` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `string` \| `null`; `naturalLanguageCode`: `string` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `string`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \} \| `null`\>

Defined in: [src/graphql/types/Tag/creator.ts:21](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/types/Tag/creator.ts#L21)

Resolves the creator user for a Tag.
Requires authentication and administrator permissions (global or organization-level).
Uses DataLoader for batched user queries to prevent N+1 behavior.

## Parameters

### parent

The Tag parent object

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

GraphQL arguments (unused)

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

GraphQL context containing dataloaders and authentication state

## Returns

`Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `string` \| `null`; `emailAddress`: `string`; `employmentStatus`: `string` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `string` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `string` \| `null`; `naturalLanguageCode`: `string` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `string`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \} \| `null`\>

The creator User object, or null if creatorId is null

## Throws

With code "unauthenticated" if user is not logged in or not found

## Throws

With code "unauthorized_action" if user lacks admin permissions

## Throws

With code "unexpected" if creator user is not found despite non-null creatorId
