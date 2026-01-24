[**talawa-api**](../../../../../README.md)

***

# Function: pledgerResolver()

> **pledgerResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `string` \| `null`; `emailAddress`: `string`; `employmentStatus`: `string` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `string` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `string` \| `null`; `naturalLanguageCode`: `string` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `string`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \}\>

Defined in: src/graphql/types/FundCampaignPledge/pledger.ts:10

## Parameters

### parent

#### amount

`number`

#### campaignId

`string`

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### id

`string`

#### note

`string` \| `null`

#### pledgerId

`string`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

### \_args

`Record`\<`string`, `unknown`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `string` \| `null`; `emailAddress`: `string`; `employmentStatus`: `string` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `string` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `string` \| `null`; `naturalLanguageCode`: `string` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `string`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \}\>
