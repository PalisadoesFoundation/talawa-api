[Admin Docs](/)

***

# Type Alias: DefaultGraphQLConnectionEdge\<NodeType\>

> **DefaultGraphQLConnectionEdge**\<`NodeType`\>: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:189](https://github.com/NishantSinghhhhh/talawa-api/blob/80d33ad4356836957a519774ac35d2e1e92179d5/src/utilities/defaultGraphQLConnection.ts#L189)

This is typescript type of a base graphql connection edge object. This connection edge object can be extended to create a custom connection edge object as long as the new connection edge object adheres to the default type of this base connection edge object.

## Type Parameters

• **NodeType**

## Type declaration

### cursor

> **cursor**: `string`

### node

> **node**: `NodeType`
