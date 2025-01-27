[**talawa-api**](../../../../README.md)

***

# Function: generateDefaultGraphQLConnection()

> **generateDefaultGraphQLConnection**\<`T0`\>(): [`DefaultGraphQLConnection`](../type-aliases/DefaultGraphQLConnection.md)\<`T0`\>

This is a factory function to create a base graphql connection object with default fields
that correspond to a connection with no data and no traversal properties in any direction.

## Type Parameters

• **T0**

## Returns

[`DefaultGraphQLConnection`](../type-aliases/DefaultGraphQLConnection.md)\<`T0`\>

## Example

```ts
const connection = generateDefaultGraphQLConnection();
```

## Defined in

[src/utilities/graphQLConnection/generateDefaultGraphQLConnection.ts:30](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/utilities/graphQLConnection/generateDefaultGraphQLConnection.ts#L30)
