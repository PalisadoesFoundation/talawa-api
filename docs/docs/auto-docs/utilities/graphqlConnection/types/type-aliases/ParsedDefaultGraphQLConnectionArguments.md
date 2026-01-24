[**talawa-api**](../../../../README.md)

***

# Type Alias: ParsedDefaultGraphQLConnectionArguments\<Cursor\>

> **ParsedDefaultGraphQLConnectionArguments**\<`Cursor`\> = `object`

Defined in: src/utilities/graphqlConnection/types.ts:4

Type of the object containing the parsed default arguments of a graphql connection.

## Type Parameters

### Cursor

`Cursor` = `string`

## Properties

### cursor?

> `optional` **cursor**: `Cursor`

Defined in: src/utilities/graphqlConnection/types.ts:8

The cursor representing the position in the connection.

***

### isInversed

> **isInversed**: `boolean`

Defined in: src/utilities/graphqlConnection/types.ts:19

This field is used to identify whether the client wants to traverse the graphql connection edges in the default order or in the inversed order.

#### Example

```ts
An example would be scrolling on twitter's home page(assuming they're using graphql connections for fetching array-like data). When scrolling down, the graphql connection traversal is the default and when scrolling up, the graphql connection traversal is inversed.
```

***

### limit

> **limit**: `number`

Defined in: src/utilities/graphqlConnection/types.ts:12

The amount of graphql connection edges to return in a single graphql connection operation.
