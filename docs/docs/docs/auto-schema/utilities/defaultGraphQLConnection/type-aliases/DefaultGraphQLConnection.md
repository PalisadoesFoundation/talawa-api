[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnection\<NodeType\>

> **DefaultGraphQLConnection**\<`NodeType`\>: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:207](https://github.com/NishantSinghhhhh/talawa-api/blob/cecfd40a68e5e0e9c8a0b8efd045a3c4381a2c01/src/utilities/defaultGraphQLConnection.ts#L207)

This is typescript type of a base graphql connection object. This connection object can be extended to create a custom connnection object as long as the new connection object adheres to the default type of this base connection object.

## Type Parameters

• **NodeType**

## Type declaration

### edges

> **edges**: [`DefaultGraphQLConnectionEdge`](DefaultGraphQLConnectionEdge.md)\<`NodeType`\>[]

### pageInfo

> **pageInfo**: [`DefaultGraphQLConnectionPageInfo`](DefaultGraphQLConnectionPageInfo.md)
