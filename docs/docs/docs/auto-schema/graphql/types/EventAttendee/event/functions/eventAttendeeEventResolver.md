[Admin Docs](/)

***

# Function: eventAttendeeEventResolver()

> **eventAttendeeEventResolver**(`parent`, `_args`, `ctx`): `Promise`\<`null` \| \{ `allDay`: `boolean`; `attachments`: `never`[]; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `endAt`: `Date`; `id`: `string`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>

Defined in: [src/graphql/types/EventAttendee/event.ts:10](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/types/EventAttendee/event.ts#L10)

## Parameters

### parent

#### checkinTime

`null` \| `Date`

#### checkoutTime

`null` \| `Date`

#### createdAt

`Date`

#### eventId

`null` \| `string`

#### feedbackSubmitted

`boolean`

#### id

`string`

#### isCheckedIn

`boolean`

#### isCheckedOut

`boolean`

#### isInvited

`boolean`

#### isRegistered

`boolean`

#### recurringEventInstanceId

`null` \| `string`

#### updatedAt

`null` \| `Date`

#### userId

`string`

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<`null` \| \{ `allDay`: `boolean`; `attachments`: `never`[]; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `endAt`: `Date`; `id`: `string`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>
