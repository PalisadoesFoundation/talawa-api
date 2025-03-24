[Admin Docs](/)

***

# Function: resolveCreatedAt()

> **resolveCreatedAt**(`parent`, `_args`, `ctx`): `Promise`\<`Date`\>

Defined in: [src/graphql/types/ActionItem/createdAt.ts:11](https://github.com/NishantSinghhhhh/talawa-api/blob/392788fe2d27c588c46069b772af4fd307c1489d/src/graphql/types/ActionItem/createdAt.ts#L11)

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
