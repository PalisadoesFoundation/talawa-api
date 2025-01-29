[Admin Docs](/)

***

# Function: updateAgendaCategory()

> **updateAgendaCategory**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>\>

This is a resolver function for the GraphQL mutation 'updateAgendaCategory'.

This resolver updates an existing agenda category based on the provided ID.
It checks if the user has the necessary permissions to update the agenda category.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateAgendaCategoryArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateAgendaCategoryArgs.md), `"input"` \| `"id"`\>

The input arguments for the mutation.

### context

`any`

The context object containing user information.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>\>

A promise that resolves to the updated agenda category.

## Throws

`NotFoundError` If the agenda category or user is not found.

## Throws

`UnauthorizedError` If the user does not have the required permissions.

## Throws

`InternalServerError` For other potential issues during agenda category update.

## Defined in

[src/resolvers/Mutation/updateAgendaCategory.ts:36](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/updateAgendaCategory.ts#L36)
