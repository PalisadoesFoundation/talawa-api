[**talawa-api**](../../../../README.md)

***

# Function: agendaCategory()

> **agendaCategory**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>\>

This is a resolver function for the GraphQL query 'agendaCategory'.

This resolver fetches an agenda category by its ID.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryAgendaCategoryArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryAgendaCategoryArgs.md), `"id"`\>

The input arguments for the query.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>\>

A promise that resolves to the fetched agenda category.

## Throws

`NotFoundError` If the agenda category is not found.

## Throws

`InternalServerError` For other potential issues during agenda category fetching.

## Defined in

[src/resolvers/Query/agendaCategory.ts:19](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/agendaCategory.ts#L19)
