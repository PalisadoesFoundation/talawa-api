[API Docs](/)

***

# Function: resolveOrgsWhereUserIsBlocked()

> **resolveOrgsWhereUserIsBlocked**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/graphqlConnection/types/type-aliases/DefaultGraphQLConnection.md)\<[`BlockedUser`](../../../BlockedUser/BlockedUser/type-aliases/BlockedUser.md)\>\>

Defined in: [src/graphql/types/User/orgsWhereUserIsBlocked.ts:54](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/User/orgsWhereUserIsBlocked.ts#L54)

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

### args

`Record`\<`string`, `unknown`\>

### ctx

`ContextType`

## Returns

`Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/graphqlConnection/types/type-aliases/DefaultGraphQLConnection.md)\<[`BlockedUser`](../../../BlockedUser/BlockedUser/type-aliases/BlockedUser.md)\>\>
