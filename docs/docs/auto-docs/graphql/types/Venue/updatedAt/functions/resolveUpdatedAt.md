[API Docs](/)

***

# Function: resolveUpdatedAt()

> **resolveUpdatedAt**(`parent`, `_args`, `ctx`): `Promise`\<`Date` \| `null`\>

Defined in: [src/graphql/types/Venue/updatedAt.ts:17](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Venue/updatedAt.ts#L17)

Resolves the updatedAt field for a Venue. Ensures the current user is authenticated
and has administrator access (system or organization) before returning the value.

## Parameters

### parent

[`Venue`](../../Venue/type-aliases/Venue.md)

The parent Venue object containing updatedAt and organizationId.

### \_args

`Record`\<`string`, `never`\>

GraphQL arguments (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context (auth, drizzle, etc.).

## Returns

`Promise`\<`Date` \| `null`\>

The venue's updatedAt date.

## Throws

TalawaGraphQLError with code "unauthenticated" if the client is not authenticated or the current user is not found.

## Throws

TalawaGraphQLError with code "unauthorized_action" if the user is not a system or organization administrator.
