[Admin Docs](/)

***

# Function: resolveGroup()

> **resolveGroup**(`parent`, `_args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string`; `eventId`: `string`; `id`: `string`; `leaderId`: `string`; `maxVolunteerCount`: `number`; `name`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

Defined in: [src/graphql/types/VolunteerGroupAssignment/group.ts:15](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/VolunteerGroupAssignment/group.ts#L15)

## Parameters

### parent

#### assigneeId

`string`

#### createdAt

`Date`

#### creatorId

`string`

#### groupId

`string`

#### inviteStatus

`"accepted"` \| `"declined"` \| `"no_response"`

#### updatedAt

`Date`

#### updaterId

`string`

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string`; `eventId`: `string`; `id`: `string`; `leaderId`: `string`; `maxVolunteerCount`: `number`; `name`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>
