[API Docs](/)

***

# Function: mobilePhoneNumberResolver()

> **mobilePhoneNumberResolver**(`parent`, `_args`, `ctx`): `Promise`\<`string` \| `null`\>

Defined in: [src/graphql/types/User/mobilePhoneNumber.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/User/mobilePhoneNumber.ts#L15)

Resolver for the User.mobilePhoneNumber field with access control.
Only administrators or the user themselves can access this field.

## Parameters

### parent

The parent User object being resolved

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

GraphQL arguments (unused)

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing authentication and database client

## Returns

`Promise`\<`string` \| `null`\>

The user's mobile phone number or throws an error if unauthorized
