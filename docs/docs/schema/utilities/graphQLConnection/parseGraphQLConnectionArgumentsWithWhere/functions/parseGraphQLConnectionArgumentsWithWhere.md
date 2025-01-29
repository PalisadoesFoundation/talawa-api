[Admin Docs](/)

***

# Function: parseGraphQLConnectionArgumentsWithWhere()

> **parseGraphQLConnectionArgumentsWithWhere**\<`T0`, `T1`\>(`__namedParameters`): [`ParseGraphQLConnectionArgumentsWithWhereResult`](../type-aliases/ParseGraphQLConnectionArgumentsWithWhereResult.md)\<`T0`, `T1`\>

This function handles validating and transforming arguments for a custom graphQL connection
that also provides filtering capabilities.

## Type Parameters

• **T0**

• **T1**

## Parameters

### \_\_namedParameters

#### args

[`DefaultGraphQLConnectionArguments`](../../type-aliases/DefaultGraphQLConnectionArguments.md)

#### maximumLimit

`number` = `MAXIMUM_FETCH_LIMIT`

#### parseCursor

[`ParseGraphQLConnectionCursor`](../../parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursor.md)\<`T0`\>

#### parseWhereResult

[`ParseGraphQLConnectionWhereResult`](../type-aliases/ParseGraphQLConnectionWhereResult.md)\<`T1`\>

## Returns

[`ParseGraphQLConnectionArgumentsWithWhereResult`](../type-aliases/ParseGraphQLConnectionArgumentsWithWhereResult.md)\<`T0`, `T1`\>

## Example

```ts
const result = await parseGraphQLConnectionArgumentsWithSortedBy({
  args: {
    after,
    first,
  },
  maximumLimit: 20,
  parseCursor,
  parseSortedBy,
})
if (result.isSuccessful === false) {
   throw new GraphQLError("Invalid arguments provided.", {
     extensions: {
       code: "INVALID_ARGUMENTS",
       errors: result.errors
     }
  })
}
const { parsedArgs: { cursor, direction, filter, limit } } = result;
```

## Defined in

[src/utilities/graphQLConnection/parseGraphQLConnectionArgumentsWithWhere.ts:70](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/graphQLConnection/parseGraphQLConnectionArgumentsWithWhere.ts#L70)
