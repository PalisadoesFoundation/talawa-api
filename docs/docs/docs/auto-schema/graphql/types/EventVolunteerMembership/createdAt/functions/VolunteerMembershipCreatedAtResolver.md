[Admin Docs](/)

***

# Function: VolunteerMembershipCreatedAtResolver()

> **VolunteerMembershipCreatedAtResolver**(`parent`, `_args`, `ctx`): `Promise`\<`Date`\>

Defined in: [src/graphql/types/EventVolunteerMembership/createdAt.ts:7](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/types/EventVolunteerMembership/createdAt.ts#L7)

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

`Promise`\<`Date`\>
