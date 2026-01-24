[API Docs](/)

***

# Function: VolunteerMembershipUpdatedByResolver()

> **VolunteerMembershipUpdatedByResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `string` \| `null`; `emailAddress`: `string`; `employmentStatus`: `string` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `string` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `string` \| `null`; `naturalLanguageCode`: `string` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `string`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \} \| `null`\>

Defined in: src/graphql/types/EventVolunteerMembership/updatedBy.ts:10

## Parameters

### parent

#### createdAt

`Date`

#### createdBy

`string` \| `null`

#### eventId

`string`

#### groupId

`string` \| `null`

#### id

`string`

#### status

`"rejected"` \| `"invited"` \| `"requested"` \| `"accepted"`

#### updatedAt

`Date` \| `null`

#### updatedBy

`string` \| `null`

#### volunteerId

`string`

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `string` \| `null`; `emailAddress`: `string`; `employmentStatus`: `string` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `string` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `string` \| `null`; `naturalLanguageCode`: `string` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `string`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \} \| `null`\>
