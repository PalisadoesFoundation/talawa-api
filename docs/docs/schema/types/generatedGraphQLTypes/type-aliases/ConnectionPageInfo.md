[**talawa-api**](../../../README.md)

***

# Type Alias: ConnectionPageInfo

> **ConnectionPageInfo**: `object`

The standard graphQL connection page info that contains metadata about a
particular instance of a connection. ALl other custom connection page info
types must implement this interface.

## Type declaration

### endCursor?

> `optional` **endCursor**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

A field to tell the value of cursor for the last edge of a particular instance of a
connection.

### hasNextPage

> **hasNextPage**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

A field to tell whether the connection has additional edges after the
edge with endCursor as its cursor.

### hasPreviousPage

> **hasPreviousPage**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

A field to tell whether the connection has additional edges
before the edge with startCursor as its cursor.

### startCursor?

> `optional` **startCursor**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

A field to tell the value of cursor for the first edge of a particular instance of a
connection.

## Defined in

[src/types/generatedGraphQLTypes.ts:378](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/types/generatedGraphQLTypes.ts#L378)
