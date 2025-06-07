[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnection\<NodeType\>

> **DefaultGraphQLConnection**\<`NodeType`\> = `object`

Defined in: src/utilities/defaultGraphQLConnection.ts:207

This is typescript type of a base graphql connection object. This connection object can be extended to create a custom connnection object as long as the new connection object adheres to the default type of this base connection object.

## Type Parameters

### NodeType

`NodeType`

## Properties

### edges

> **edges**: [`DefaultGraphQLConnectionEdge`](DefaultGraphQLConnectionEdge.md)\<`NodeType`\>[]

Defined in: src/utilities/defaultGraphQLConnection.ts:208

***

### pageInfo

> **pageInfo**: [`DefaultGraphQLConnectionPageInfo`](DefaultGraphQLConnectionPageInfo.md)

Defined in: src/utilities/defaultGraphQLConnection.ts:209
