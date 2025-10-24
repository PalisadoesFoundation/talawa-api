[Admin Docs](/)

***

# Function: VolunteerMembershipUpdatedAtResolver()

> **VolunteerMembershipUpdatedAtResolver**(`parent`, `_args`, `ctx`): `Promise`\<`null` \| `Date`\>

Defined in: [src/graphql/types/EventVolunteerMembership/updatedAt.ts:7](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/types/EventVolunteerMembership/updatedAt.ts#L7)

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

`Promise`\<`null` \| `Date`\>
