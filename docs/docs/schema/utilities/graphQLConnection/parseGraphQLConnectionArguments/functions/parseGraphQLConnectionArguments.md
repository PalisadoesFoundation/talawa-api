[Admin Docs](/)

***

# Function: parseGraphQLConnectionArguments()

> **parseGraphQLConnectionArguments**\<`T0`\>(`__namedParameters`): `Promise`\<[`ParseGraphQLConnectionArgumentsResult`](../type-aliases/ParseGraphQLConnectionArgumentsResult.md)\<`T0`\>\>

This function handles validating and transforming arguments of a base graphQL connection.

## Type Parameters

• **T0**

## Parameters

### \_\_namedParameters

#### args

[`DefaultGraphQLConnectionArguments`](../../type-aliases/DefaultGraphQLConnectionArguments.md)

#### maximumLimit

`number` = `MAXIMUM_FETCH_LIMIT`

#### parseCursor

[`ParseGraphQLConnectionCursor`](../type-aliases/ParseGraphQLConnectionCursor.md)\<`T0`\>

## Returns

`Promise`\<[`ParseGraphQLConnectionArgumentsResult`](../type-aliases/ParseGraphQLConnectionArgumentsResult.md)\<`T0`\>\>

## Example

```ts
const result = await parseGraphQLConnectionArguments({
  args: {
    after,
    first,
  },
  maximumLimit: 20,
  parseCursor
})
if (result.isSuccessful === false) {
   throw new GraphQLError("Invalid arguments provided.", {
     extensions: {
       code: "INVALID_ARGUMENTS",
       errors: result.errors
     }
  })
}
const { parsedArgs: { cursor, direction, limit } } = result;
```

## Defined in

[src/utilities/graphQLConnection/parseGraphQLConnectionArguments.ts:88](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/graphQLConnection/parseGraphQLConnectionArguments.ts#L88)
