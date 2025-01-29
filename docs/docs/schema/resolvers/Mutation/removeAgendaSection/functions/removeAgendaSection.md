[**talawa-api**](../../../../README.md)

***

# Function: removeAgendaSection()

> **removeAgendaSection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\>\>

Resolver function for the GraphQL mutation 'removeAgendaSection'.

This resolver removes an agenda section and performs necessary authorization checks.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveAgendaSectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveAgendaSectionArgs.md), `"id"`\>

The input arguments for the mutation.

### context

`any`

The context object containing user information.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\>\>

A promise that resolves to the ID of the removed agenda section.

## Defined in

[src/resolvers/Mutation/removeAgendaSection.ts:25](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/removeAgendaSection.ts#L25)
