[**talawa-api**](../../../../../README.md)

***

# Function: userEventsAttendedResolver()

> **userEventsAttendedResolver**(`parent`, `_args`, `ctx`): `Promise`\<`NonNullable`\<\{ `allDay`: `boolean`; `attachments`: `object`[]; `attachmentsWhereEvent`: `object`[]; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| \{ `actualEndTime`: `Date`; `actualStartTime`: `Date`; `allDay`: `boolean`; `attachments`: `never`[]; `baseRecurringEvent`: \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}; `baseRecurringEventId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `generatedAt`: `Date`; `id`: `string`; `isCancelled`: `boolean`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `lastUpdatedAt`: `Date` \| `null`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `originalInstanceStartTime`: `Date`; `originalSeriesId`: `string`; `recurrenceRuleId`: `string`; `sequenceNumber`: `number`; `startAt`: `Date`; `totalCount`: `number` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `version`: `string`; \} \| `null`\>[]\>

Defined in: src/graphql/types/User/eventsAttended.ts:10

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

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<`NonNullable`\<\{ `allDay`: `boolean`; `attachments`: `object`[]; `attachmentsWhereEvent`: `object`[]; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| \{ `actualEndTime`: `Date`; `actualStartTime`: `Date`; `allDay`: `boolean`; `attachments`: `never`[]; `baseRecurringEvent`: \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}; `baseRecurringEventId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `generatedAt`: `Date`; `id`: `string`; `isCancelled`: `boolean`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `lastUpdatedAt`: `Date` \| `null`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `originalInstanceStartTime`: `Date`; `originalSeriesId`: `string`; `recurrenceRuleId`: `string`; `sequenceNumber`: `number`; `startAt`: `Date`; `totalCount`: `number` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `version`: `string`; \} \| `null`\>[]\>
