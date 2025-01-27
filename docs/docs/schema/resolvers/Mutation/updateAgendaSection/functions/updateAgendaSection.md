[**talawa-api**](../../../../README.md)

***

# Function: updateAgendaSection()

> **updateAgendaSection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\>\>

Resolver function for the GraphQL mutation 'updateAgendaSection'.

This resolver updates an agenda section and performs necessary authorization checks.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateAgendaSectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateAgendaSectionArgs.md), `"input"` \| `"id"`\>

The input arguments for the mutation.

### context

`any`

The context object containing user information.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\>\>

A promise that resolves to the updated agenda section.

## Defined in

[src/resolvers/Mutation/updateAgendaSection.ts:30](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/updateAgendaSection.ts#L30)
