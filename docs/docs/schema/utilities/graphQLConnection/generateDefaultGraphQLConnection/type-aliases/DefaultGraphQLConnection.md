[**talawa-api**](../../../../README.md)

***

# Type Alias: DefaultGraphQLConnection\<T0\>

> **DefaultGraphQLConnection**\<`T0`\>: `object`

This is typescript type of a base graphQL connection object. This connection object can be
extended to create a custom connnection object as long as the new connection object adheres
to the default type of this base connection object.

## Type Parameters

• **T0**

## Type declaration

### edges

> **edges**: [`DefaultGraphQLConnectionEdge`](DefaultGraphQLConnectionEdge.md)\<`T0`\>[]

### pageInfo

> **pageInfo**: [`ConnectionPageInfo`](../../../../types/generatedGraphQLTypes/type-aliases/ConnectionPageInfo.md)

### totalCount

> **totalCount**: `number`

## Defined in

[src/utilities/graphQLConnection/generateDefaultGraphQLConnection.ts:18](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/graphQLConnection/generateDefaultGraphQLConnection.ts#L18)
