[Admin Docs](/)

***

# Type Alias: ParsedDefaultGraphQLConnectionArguments\<Cursor\>

> **ParsedDefaultGraphQLConnectionArguments**\<`Cursor`\>: `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:6](https://github.com/PurnenduMIshra129th/talawa-api/blob/4369c9351f5b76f958b297b25ab2b17196210af9/src/utilities/defaultGraphQLConnection.ts#L6)

Type of the object containing the parsed default arguments of a graphql connection.

## Type Parameters

• **Cursor** = `string`

## Type declaration

### cursor?

> `optional` **cursor**: `Cursor`

The cursor representing the position in the connection.

### isInversed

> **isInversed**: `boolean`

This field is used to identify whether the client wants to traverse the graphql connection edges in the default order or in the inversed order.

#### Example

```ts
An example would be scrolling on twitter's home page(assuming they're using graphql connections for fetching array-like data). When scrolling down, the graphql connection traversal is the default and when scrolling up, the graphql connection traversal is inversed.
```

### limit

> **limit**: `number`

The amount of graphql connection edges to return in a single graphql connection operation.
