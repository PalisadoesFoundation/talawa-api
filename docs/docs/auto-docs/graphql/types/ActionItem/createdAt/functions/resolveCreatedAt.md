[**talawa-api**](../../../../../README.md)

***

# Function: resolveCreatedAt()

> **resolveCreatedAt**(`parent`, `_args`, `ctx`): `Promise`\<`Date`\>

Defined in: [src/graphql/types/ActionItem/createdAt.ts:11](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/types/ActionItem/createdAt.ts#L11)

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
