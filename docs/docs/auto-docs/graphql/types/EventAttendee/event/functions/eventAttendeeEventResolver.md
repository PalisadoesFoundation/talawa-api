[API Docs](/)

---

# Function: eventAttendeeEventResolver()

> **eventAttendeeEventResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `allDay`: `boolean`; `attachments`: `never`[]; `attachmentsPolicy`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `recurrenceRule`: `string` \| `null`; `recurrenceUntil`: `Date` \| `null`; `startAt`: `Date`; `timezone`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| `null`\>

Defined in: [src/graphql/types/EventAttendee/event.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/EventAttendee/event.ts#L18)

Resolves the event that an event attendee is associated with.

## Parameters

### parent

The parent EventAttendee object containing the eventId.

#### checkinTime

`Date` \| `null`

#### checkoutTime

`Date` \| `null`

#### createdAt

`Date`

#### eventId

`string` \| `null`

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

`string` \| `null`

#### updatedAt

`Date` \| `null`

#### userId

`string`

### \_args

`Record`\<`string`, `never`\>

GraphQL arguments (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing dataloaders and logging utilities.

## Returns

`Promise`\<\{ `allDay`: `boolean`; `attachments`: `never`[]; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| `null`\>

The event the attendee is associated with, or null for recurring instances.

## Throws

TalawaGraphQLError with code "unauthenticated" if user is not authenticated.

## Throws

TalawaGraphQLError with code "unexpected" if event is not found (indicates data corruption).
