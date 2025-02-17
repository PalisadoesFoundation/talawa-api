[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnectionEdge\<NodeType\>

> **DefaultGraphQLConnectionEdge**\<`NodeType`\>: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:126](https://github.com/Suyash878/talawa-api/blob/05d9dfc8d9c5928ef559c72f2ab0492d0dbbb48c/src/utilities/defaultGraphQLConnection.ts#L126)

This is typescript type of a base graphql connection edge object. This connection edge object can be extended to create a custom connection edge object as long as the new connection edge object adheres to the default type of this base connection edge object.

## Type Parameters

• **NodeType**

## Type declaration

### cursor

> **cursor**: `string`

### node

> **node**: `NodeType`
