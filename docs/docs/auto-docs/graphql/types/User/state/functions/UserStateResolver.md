[API Docs](/)

***

# Function: UserStateResolver()

> **UserStateResolver**(`parent`, `_args`, `ctx`): `Promise`\<[`HTMLSafeString`](../../../../../utilities/sanitizer/type-aliases/HTMLSafeString.md) \| `null`\>

Defined in: [src/graphql/types/User/state.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/User/state.ts#L21)

Resolver for the `state` field of the `User` type.

This function retrieves the state of a user. It enforces authorization rules:
- The user must be authenticated.
- The user must be the same as the parent user or an administrator.

## Parameters

### parent

The parent `User` object.

#### addressLine1

`string` \| `null`

#### addressLine2

`string` \| `null`

#### avatarMimeType

`string` \| `null`

#### avatarName

`string` \| `null`

#### birthDate

`Date` \| `null`

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

#### educationGrade

`string` \| `null`

#### emailAddress

`string`

#### employmentStatus

`string` \| `null`

#### failedLoginAttempts

`number`

#### homePhoneNumber

`string` \| `null`

#### id

`string`

#### isEmailAddressVerified

`boolean`

#### lastFailedLoginAt

`Date` \| `null`

#### lockedUntil

`Date` \| `null`

#### maritalStatus

`string` \| `null`

#### mobilePhoneNumber

`string` \| `null`

#### name

`string`

#### natalSex

`string` \| `null`

#### naturalLanguageCode

`string` \| `null`

#### passwordHash

`string`

#### postalCode

`string` \| `null`

#### role

`string`

#### state

`string` \| `null`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

#### workPhoneNumber

`string` \| `null`

### \_args

`unknown`

The arguments for the field (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing the current client and Drizzle client.

## Returns

`Promise`\<[`HTMLSafeString`](../../../../../utilities/sanitizer/type-aliases/HTMLSafeString.md) \| `null`\>

The escaped state string of the user.

## Throws

if the user is unauthenticated or unauthorized.
