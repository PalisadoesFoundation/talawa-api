[Admin Docs](/)

***

# Function: getAgendaSection()

> **getAgendaSection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\>\>

Resolver function for the GraphQL query 'getAgendaSection'.

This resolver retrieves an agenda section by its ID.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetAgendaSectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetAgendaSectionArgs.md), `"id"`\>

The input arguments for the query.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\>\>

## Defined in

[src/resolvers/Query/getAgendaSection.ts:14](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Query/getAgendaSection.ts#L14)
