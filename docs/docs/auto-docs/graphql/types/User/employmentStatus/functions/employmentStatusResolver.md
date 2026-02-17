[API Docs](/)

***

# Function: employmentStatusResolver()

> **employmentStatusResolver**(`parent`, `_args`, `ctx`): `Promise`\<`"full_time"` \| `"part_time"` \| `"unemployed"` \| `null`\>

Defined in: [src/graphql/types/User/employmentStatus.ts:19](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/User/employmentStatus.ts#L19)

Resolver for the `employmentStatus` field of the `User` type.

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

`Record`\<`string`, `never`\>

The arguments for the field (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing the current client and Drizzle client.

## Returns

`Promise`\<`"full_time"` \| `"part_time"` \| `"unemployed"` \| `null`\>

The employment status of the user, or null if not set.

## Throws

if the user is unauthenticated or unauthorized.
