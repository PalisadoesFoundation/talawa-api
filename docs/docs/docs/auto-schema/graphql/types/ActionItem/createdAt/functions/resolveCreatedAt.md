[Admin Docs](/)

***

# Function: resolveCreatedAt()

> **resolveCreatedAt**(`parent`, `_args`, `ctx`): `Promise`\<`Date`\>

Defined in: [src/graphql/types/ActionItem/createdAt.ts:11](https://github.com/NishantSinghhhhh/talawa-api/blob/eec373445d0a4b36c011832ad5010e69e112315d/src/graphql/types/ActionItem/createdAt.ts#L11)

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
