[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnection\<NodeType\>

> **DefaultGraphQLConnection**\<`NodeType`\>: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:144](https://github.com/Suyash878/talawa-api/blob/dd80c416ddd46afdb07c628dc824194bc09930cc/src/utilities/defaultGraphQLConnection.ts#L144)

This is typescript type of a base graphql connection object. This connection object can be extended to create a custom connnection object as long as the new connection object adheres to the default type of this base connection object.

## Type Parameters

• **NodeType**

## Type declaration

### edges

> **edges**: [`DefaultGraphQLConnectionEdge`](DefaultGraphQLConnectionEdge.md)\<`NodeType`\>[]

### pageInfo

> **pageInfo**: [`DefaultGraphQLConnectionPageInfo`](DefaultGraphQLConnectionPageInfo.md)
