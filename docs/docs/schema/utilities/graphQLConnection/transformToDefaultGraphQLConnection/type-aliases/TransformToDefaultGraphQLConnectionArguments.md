[**talawa-api**](../../../../README.md)

***

# Type Alias: TransformToDefaultGraphQLConnectionArguments\<T0, T1, T2\>

> **TransformToDefaultGraphQLConnectionArguments**\<`T0`, `T1`, `T2`\>: `object`

## Type Parameters

• **T0**

• **T1**

• **T2**

## Type declaration

### createCursor?

> `optional` **createCursor**: [`CreateCursor`](CreateCursor.md)\<`T1`\>

### createNode?

> `optional` **createNode**: [`CreateNode`](CreateNode.md)\<`T1`, `T2`\>

### objectList

> **objectList**: `T1`[]

### parsedArgs

> **parsedArgs**: [`ParsedGraphQLConnectionArguments`](../../parseGraphQLConnectionArguments/type-aliases/ParsedGraphQLConnectionArguments.md)\<`T0`\>

### totalCount

> **totalCount**: `number`

## Defined in

[src/utilities/graphQLConnection/transformToDefaultGraphQLConnection.ts:18](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/utilities/graphQLConnection/transformToDefaultGraphQLConnection.ts#L18)
