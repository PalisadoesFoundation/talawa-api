[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnectionPageInfo

> **DefaultGraphQLConnectionPageInfo**: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:197](https://github.com/PalisadoesFoundation/talawa-api/blob/f1b6ec0d386e11c6dc4f3cf8bb763223ff502e1e/src/utilities/defaultGraphQLConnection.ts#L197)

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
