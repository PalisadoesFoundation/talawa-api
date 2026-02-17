[API Docs](/)

***

# Function: addressLine2Resolver()

> **addressLine2Resolver**(`parent`, `_args`, `ctx`): `Promise`\<`string` \| `null`\>

Defined in: [src/graphql/types/User/addressLine2.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/User/addressLine2.ts#L18)

Resolver for the `addressLine2` field on the `User` type.
Checks authentication and authorization before returning the escaped value.

## Parameters

### parent

The parent `User` object containing the raw addressLine2 value.

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

`Record`\<`string`, `never`\>

The arguments for the field (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing the current client and Drizzle client.

## Returns

`Promise`\<`string` \| `null`\>

The HTML-escaped addressLine2 string, or null if not set.

## Throws

if the user is unauthenticated or unauthorized.
