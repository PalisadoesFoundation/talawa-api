[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnectionPageInfo

> **DefaultGraphQLConnectionPageInfo**: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:197](https://github.com/NishantSinghhhhh/talawa-api/blob/92ff044a4e2bbc8719de2b33b4f8d7d0a9aa0174/src/utilities/defaultGraphQLConnection.ts#L197)

This is typescript type of a base graphql connection page info object. This connection page info object can be extended to create a custom connnection page info object as long as the new connection object adheres to the default type of this base connection object.

## Type declaration

### endCursor

> **endCursor**: `string` \| `null`

### hasNextPage

> **hasNextPage**: `boolean`

### hasPreviousPage

> **hasPreviousPage**: `boolean`

### startCursor

> **startCursor**: `string` \| `null`
