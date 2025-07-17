[Admin Docs](/)

***

# Function: resolveGroup()

> **resolveGroup**(`parent`, `_args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string`; `eventId`: `string`; `id`: `string`; `leaderId`: `string`; `maxVolunteerCount`: `number`; `name`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

Defined in: [src/graphql/types/VolunteerGroupAssignment/group.ts:15](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/graphql/types/VolunteerGroupAssignment/group.ts#L15)

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
