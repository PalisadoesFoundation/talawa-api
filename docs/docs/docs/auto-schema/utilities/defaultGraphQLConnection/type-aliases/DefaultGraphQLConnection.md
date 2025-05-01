[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnection\<NodeType\>

> **DefaultGraphQLConnection**\<`NodeType`\> = `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:207](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/utilities/defaultGraphQLConnection.ts#L207)

This is typescript type of a base graphql connection object. This connection object can be extended to create a custom connnection object as long as the new connection object adheres to the default type of this base connection object.

## Type Parameters

### NodeType

`NodeType`

## Properties

### edges

> **edges**: [`DefaultGraphQLConnectionEdge`](DefaultGraphQLConnectionEdge.md)\<`NodeType`\>[]

Defined in: [src/utilities/defaultGraphQLConnection.ts:208](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/utilities/defaultGraphQLConnection.ts#L208)

***

### pageInfo

> **pageInfo**: [`DefaultGraphQLConnectionPageInfo`](DefaultGraphQLConnectionPageInfo.md)

Defined in: [src/utilities/defaultGraphQLConnection.ts:209](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/utilities/defaultGraphQLConnection.ts#L209)
