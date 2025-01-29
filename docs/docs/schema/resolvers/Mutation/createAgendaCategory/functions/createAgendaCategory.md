[Admin Docs](/)

***

# Function: createAgendaCategory()

> **createAgendaCategory**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>\>

Creates a new agenda category and associates it with a specified organization.

This resolver function performs the following steps:

1. Retrieves the current user based on the userId from the context.
2. Fetches the associated app user profile for the current user.
3. Retrieves the organization specified in the input, either from the cache or from the database.
4. Validates the existence of the organization.
5. Checks if the current user is authorized to perform this operation.
6. Creates a new agenda category and associates it with the specified organization.
7. Updates the organization document with the new agenda category.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateAgendaCategoryArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateAgendaCategoryArgs.md), `"input"`\>

The arguments provided with the request, including:
  - `input`: An object containing:
    - `organizationId`: The ID of the organization to which the new agenda category will be added.
    - `name`: The name of the new agenda category.
    - `description`: A description of the new agenda category.

### context

`any`

The context of the entire application, including user information (context.userId).

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>\>

A promise that resolves to the created agenda category object.

## Remarks

The function performs caching and retrieval operations to ensure the latest data is used,
and it updates the organization document to include the new agenda category.

## Defined in

[src/resolvers/Mutation/createAgendaCategory.ts:49](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/createAgendaCategory.ts#L49)
