[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnection\<NodeType\>

> **DefaultGraphQLConnection**\<`NodeType`\>: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:207](https://github.com/NishantSinghhhhh/talawa-api/blob/c589e7bc1eb842c2fd40f1d8b61882c5c36978fe/src/utilities/defaultGraphQLConnection.ts#L207)

This is typescript type of a base graphql connection object. This connection object can be extended to create a custom connnection object as long as the new connection object adheres to the default type of this base connection object.

## Type Parameters

• **NodeType**

## Type declaration

### edges

> **edges**: [`DefaultGraphQLConnectionEdge`](DefaultGraphQLConnectionEdge.md)\<`NodeType`\>[]

### pageInfo

> **pageInfo**: [`DefaultGraphQLConnectionPageInfo`](DefaultGraphQLConnectionPageInfo.md)
