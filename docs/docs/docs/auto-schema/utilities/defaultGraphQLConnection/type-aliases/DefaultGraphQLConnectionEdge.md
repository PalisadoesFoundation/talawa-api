[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnectionEdge\<NodeType\>

> **DefaultGraphQLConnectionEdge**\<`NodeType`\>: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:189](https://github.com/PalisadoesFoundation/talawa-api/blob/720213b8973f1ef622d2c99f376ffc6c960847d1/src/utilities/defaultGraphQLConnection.ts#L189)

This is typescript type of a base graphql connection edge object. This connection edge object can be extended to create a custom connection edge object as long as the new connection edge object adheres to the default type of this base connection edge object.

## Type Parameters

• **NodeType**

## Type declaration

### cursor

> **cursor**: `string`

### node

> **node**: `NodeType`
