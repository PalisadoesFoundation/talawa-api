[Admin Docs](/)

***

# Type Alias: ParsedDefaultGraphQLConnectionArgumentsWithWhere\<Cursor, Where\>

> **ParsedDefaultGraphQLConnectionArgumentsWithWhere**\<`Cursor`, `Where`\>: [`ParsedDefaultGraphQLConnectionArguments`](ParsedDefaultGraphQLConnectionArguments.md)\<`Cursor`\> & `object`

Defined in: src/utilities/defaultGraphQLConnection.ts:28

Type of the object containing the parsed default arguments of a graphql connection with where filtering.
Extends the base connection arguments with a generic where type.

## Type declaration

### where

> **where**: `Where`

The where filter criteria to apply to the connection.

## Type Parameters

• **Cursor** = `string`

• **Where** = `unknown`
