[Admin Docs](/)

***

# Function: VolunteerMembershipGroupResolver()

> **VolunteerMembershipGroupResolver**(`parent`, `_args`, `ctx`): `Promise`\<`null` \| \{ `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `eventId`: `string`; `id`: `string`; `isTemplate`: `boolean`; `leaderId`: `string`; `name`: `string`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; `volunteersRequired`: `null` \| `number`; \}\>

Defined in: [src/graphql/types/EventVolunteerMembership/group.ts:10](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/types/EventVolunteerMembership/group.ts#L10)

## Parameters

### parent

#### createdAt

`Date`

#### createdBy

`null` \| `string`

#### eventId

`string`

#### groupId

`null` \| `string`

#### id

`string`

#### status

`"rejected"` \| `"invited"` \| `"requested"` \| `"accepted"`

#### updatedAt

`null` \| `Date`

#### updatedBy

`null` \| `string`

#### volunteerId

`string`

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<`null` \| \{ `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `eventId`: `string`; `id`: `string`; `isTemplate`: `boolean`; `leaderId`: `string`; `name`: `string`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; `volunteersRequired`: `null` \| `number`; \}\>
