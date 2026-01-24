[**talawa-api**](../../../../README.md)

***

# Function: transformToDefaultGraphQLConnection()

> **transformToDefaultGraphQLConnection**\<`RawNode`, `Node`, `Cursor`\>(`__namedParameters`): [`DefaultGraphQLConnection`](../../types/type-aliases/DefaultGraphQLConnection.md)\<`Node`\>

Defined in: src/utilities/graphqlConnection/builder.ts:40

This function is used to transform an array of objects to a standard graphql connection object.

## Type Parameters

### RawNode

`RawNode`

### Node

`Node` = `RawNode`

### Cursor

`Cursor` = `string`

## Parameters

### \_\_namedParameters

#### createCursor

(`rawNode`) => `Cursor`

#### createNode

(`rawNode`) => `Node`

#### parsedArgs

[`ParsedDefaultGraphQLConnectionArguments`](../../types/type-aliases/ParsedDefaultGraphQLConnectionArguments.md)\<`Cursor`\>

#### rawNodes

`RawNode`[]

## Returns

[`DefaultGraphQLConnection`](../../types/type-aliases/DefaultGraphQLConnection.md)\<`Node`\>

## Remarks

The logic used in this function is common to almost all graphql connection creation flows, abstracting that away into this function lets developers use a declarative way to create the graphql connection object they want and prevent code duplication.

## Example

```ts
const orderBy = parsedArgs.isInverted ? asc(fields.id) : desc(fields.id);
let where;

if (parsedArgs.isInverted) {
	if (parsedArgs.cursor !== undefined) {
		where = and(eq(usersTable.id, parsedArgs.cursor), lt(usersTable.id, parsedArgs.cursor));
	}
} else {
	if (parsedArgs.cursor !== undefined) {
		where = and(eq(usersTable.id, parsedArgs.cursor), gt(usersTable.id, parsedArgs.cursor));
	}
}

const users = await drizzleClient.usersTable.findMany({
	limit: parsedArgs.limit,
	orderBy,
	where,
})

const usersConnection = transformToDefaultGraphQLConnection({
	createCursor: (rawNode) => rawNode.id,
	createNode: (rawNode) => rawNode,
	parsedArgs,
	rawNodes: users,
});
```
