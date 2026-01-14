[**talawa-api**](../../../README.md)

***

# Type Alias: ParsedDefaultGraphQLConnectionArguments\<Cursor\>

> **ParsedDefaultGraphQLConnectionArguments**\<`Cursor`\> = `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:6](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/defaultGraphQLConnection.ts#L6)

Type of the object containing the parsed default arguments of a graphql connection.

## Type Parameters

### Cursor

`Cursor` = `string`

## Properties

### cursor?

> `optional` **cursor**: `Cursor`

Defined in: [src/utilities/defaultGraphQLConnection.ts:10](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/defaultGraphQLConnection.ts#L10)

The cursor representing the position in the connection.

***

### isInversed

> **isInversed**: `boolean`

Defined in: [src/utilities/defaultGraphQLConnection.ts:21](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/defaultGraphQLConnection.ts#L21)

This field is used to identify whether the client wants to traverse the graphql connection edges in the default order or in the inversed order.

#### Example

```ts
An example would be scrolling on twitter's home page(assuming they're using graphql connections for fetching array-like data). When scrolling down, the graphql connection traversal is the default and when scrolling up, the graphql connection traversal is inversed.
```

***

### limit

> **limit**: `number`

Defined in: [src/utilities/defaultGraphQLConnection.ts:14](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/defaultGraphQLConnection.ts#L14)

The amount of graphql connection edges to return in a single graphql connection operation.
