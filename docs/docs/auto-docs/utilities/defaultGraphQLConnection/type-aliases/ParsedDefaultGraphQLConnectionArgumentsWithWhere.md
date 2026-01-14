[**talawa-api**](../../../README.md)

***

# Type Alias: ParsedDefaultGraphQLConnectionArgumentsWithWhere\<Cursor, Where\>

> **ParsedDefaultGraphQLConnectionArgumentsWithWhere**\<`Cursor`, `Where`\> = [`ParsedDefaultGraphQLConnectionArguments`](ParsedDefaultGraphQLConnectionArguments.md)\<`Cursor`\> & `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:28](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/defaultGraphQLConnection.ts#L28)

Type of the object containing the parsed default arguments of a graphql connection with where filtering.
Extends the base connection arguments with a generic where type.

## Type Declaration

### where

> **where**: `Where`

The where filter criteria to apply to the connection.

## Type Parameters

### Cursor

`Cursor` = `string`

### Where

`Where` = `unknown`
