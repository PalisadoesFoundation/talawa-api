[API Docs](/)

***

# Type Alias: DefaultGraphQLConnection\<NodeType\>

> **DefaultGraphQLConnection**\<`NodeType`\> = `object`

Defined in: [src/utilities/graphqlConnection/types.ts:57](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/graphqlConnection/types.ts#L57)

This is typescript type of a base graphql connection object. This connection object can be extended to create a custom connnection object as long as the new connection object adheres to the default type of this base connection object.

## Type Parameters

### NodeType

`NodeType`

## Properties

### edges

> **edges**: [`DefaultGraphQLConnectionEdge`](DefaultGraphQLConnectionEdge.md)\<`NodeType`\>[]

Defined in: [src/utilities/graphqlConnection/types.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/graphqlConnection/types.ts#L58)

***

### pageInfo

> **pageInfo**: [`DefaultGraphQLConnectionPageInfo`](DefaultGraphQLConnectionPageInfo.md)

Defined in: [src/utilities/graphqlConnection/types.ts:59](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/graphqlConnection/types.ts#L59)
