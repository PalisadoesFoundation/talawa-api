[API Docs](/)

***

# Function: eventAttendeeCreatedAtResolver()

> **eventAttendeeCreatedAtResolver**(`parent`, `_args`, `ctx`): `Promise`\<`Date`\>

Defined in: [src/graphql/types/EventAttendee/createdAt.ts:9](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/EventAttendee/createdAt.ts#L9)

## Parameters

### parent

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

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<`Date`\>
