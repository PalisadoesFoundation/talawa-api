[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnectionEdge\<NodeType\>

> **DefaultGraphQLConnectionEdge**\<`NodeType`\>: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:189](https://github.com/PalisadoesFoundation/talawa-api/blob/04adcbca27f07ca5c0bffce211b6e6b77a1828ce/src/utilities/defaultGraphQLConnection.ts#L189)

This is typescript type of a base graphql connection edge object. This connection edge object can be extended to create a custom connection edge object as long as the new connection edge object adheres to the default type of this base connection edge object.

## Type Parameters

• **NodeType**

## Type declaration

### cursor

> **cursor**: `string`

### node

> **node**: `NodeType`
