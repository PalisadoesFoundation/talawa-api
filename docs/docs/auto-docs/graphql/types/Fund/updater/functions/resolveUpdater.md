[**talawa-api**](../../../../../README.md)

***

# Function: resolveUpdater()

> **resolveUpdater**(`parent`, `_`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `string` \| `null`; `emailAddress`: `string`; `employmentStatus`: `string` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `string` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `string` \| `null`; `naturalLanguageCode`: `string` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `string`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \} \| `null`\>

Defined in: src/graphql/types/Fund/updater.ts:36

## Parameters

### parent

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

### \_

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `string` \| `null`; `emailAddress`: `string`; `employmentStatus`: `string` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `string` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `string` \| `null`; `naturalLanguageCode`: `string` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `string`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \} \| `null`\>
