[Admin Docs](/)

***

# Function: VolunteerMembershipVolunteerResolver()

> **VolunteerMembershipVolunteerResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `null` \| `string`; `eventId`: `string`; `hasAccepted`: `boolean`; `hoursVolunteered`: `string`; `id`: `string`; `isPublic`: `boolean`; `isTemplate`: `boolean`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; `userId`: `string`; \}\>

Defined in: [src/graphql/types/EventVolunteerMembership/volunteer.ts:10](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/graphql/types/EventVolunteerMembership/volunteer.ts#L10)

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

`Promise`\<\{ `createdAt`: `Date`; `creatorId`: `null` \| `string`; `eventId`: `string`; `hasAccepted`: `boolean`; `hoursVolunteered`: `string`; `id`: `string`; `isPublic`: `boolean`; `isTemplate`: `boolean`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; `userId`: `string`; \}\>
