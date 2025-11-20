[API Docs](/)

***

# Function: VolunteerMembershipVolunteerResolver()

> **VolunteerMembershipVolunteerResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `eventId`: `string`; `hasAccepted`: `boolean`; `hoursVolunteered`: `string`; `id`: `string`; `isPublic`: `boolean`; `isTemplate`: `boolean`; `recurringEventInstanceId`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userId`: `string`; \}\>

Defined in: [src/graphql/types/EventVolunteerMembership/volunteer.ts:10](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/EventVolunteerMembership/volunteer.ts#L10)

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

`Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `eventId`: `string`; `hasAccepted`: `boolean`; `hoursVolunteered`: `string`; `id`: `string`; `isPublic`: `boolean`; `isTemplate`: `boolean`; `recurringEventInstanceId`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userId`: `string`; \}\>
