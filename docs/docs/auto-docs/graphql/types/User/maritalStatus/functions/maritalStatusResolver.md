[API Docs](/)

***

# Function: maritalStatusResolver()

> **maritalStatusResolver**(`parent`, `_args`, `ctx`): `Promise`\<`"divorced"` \| `"engaged"` \| `"married"` \| `"seperated"` \| `"single"` \| `"widowed"` \| `null`\>

Defined in: [src/graphql/types/User/maritalStatus.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/User/maritalStatus.ts#L23)

Resolver for the user's marital status field.

This resolver checks authentication and authorization before returning
the marital status of a user. Only authenticated users can access this field,
and non-administrators can only access their own marital status.

## Parameters

### parent

The parent User object containing the user's data

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

The resolver arguments (unused)

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing authentication and database client

## Returns

`Promise`\<`"divorced"` \| `"engaged"` \| `"married"` \| `"seperated"` \| `"single"` \| `"widowed"` \| `null`\>

The user's marital status or null if not set

## Throws

With code "unauthenticated" if user is not authenticated or not found

## Throws

With code "unauthorized_action" if non-admin tries to access another user's data
