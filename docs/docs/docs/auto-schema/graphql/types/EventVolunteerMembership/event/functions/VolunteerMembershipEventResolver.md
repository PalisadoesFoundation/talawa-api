[Admin Docs](/)

***

# Function: VolunteerMembershipEventResolver()

> **VolunteerMembershipEventResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `allDay`: `boolean`; `attachments`: `never`[]; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `endAt`: `Date`; `id`: `string`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>

Defined in: [src/graphql/types/EventVolunteerMembership/event.ts:10](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/types/EventVolunteerMembership/event.ts#L10)

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

`Promise`\<\{ `allDay`: `boolean`; `attachments`: `never`[]; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `endAt`: `Date`; `id`: `string`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>
