[Admin Docs](/)

***

# Function: resolveGroup()

> **resolveGroup**(`parent`, `_args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string`; `eventId`: `string`; `id`: `string`; `leaderId`: `string`; `maxVolunteerCount`: `number`; `name`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

Defined in: [src/graphql/types/VolunteerGroupAssignment/group.ts:15](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/graphql/types/VolunteerGroupAssignment/group.ts#L15)

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
