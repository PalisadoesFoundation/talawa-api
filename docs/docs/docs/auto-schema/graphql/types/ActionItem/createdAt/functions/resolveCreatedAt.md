[Admin Docs](/)

***

# Function: resolveCreatedAt()

> **resolveCreatedAt**(`parent`, `_args`, `ctx`): `Promise`\<`Date`\>

Defined in: [src/graphql/types/ActionItem/createdAt.ts:11](https://github.com/NishantSinghhhhh/talawa-api/blob/92ff044a4e2bbc8719de2b33b4f8d7d0a9aa0174/src/graphql/types/ActionItem/createdAt.ts#L11)

Resolver for the createdAt field on ActionItem.
Returns the createdAt timestamp if the current user is authenticated
and is either an administrator or has an organization membership with administrator privileges.

## Parameters

### parent

#### createdAt

`Date`

#### organizationId

`string`

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<`Date`\>
