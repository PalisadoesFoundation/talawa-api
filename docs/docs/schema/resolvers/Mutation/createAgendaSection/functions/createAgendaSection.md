[Admin Docs](/)

***

# Function: createAgendaSection()

> **createAgendaSection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\>\>

Creates a new agenda section and performs authorization checks.

This resolver performs the following steps:

1. Retrieves the current user based on the userId from the context.
2. Fetches the associated app user profile for the current user.
3. Validates the existence of the related event and checks user permissions.
4. Creates a new agenda section and sets the appropriate metadata.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateAgendaSectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateAgendaSectionArgs.md), `"input"`\>

The arguments provided with the mutation, including:
  - `input`: An object containing:
    - `relatedEvent`: The ID of the event to which the new agenda section is related.
    - Additional fields for the agenda section.

### context

`any`

The context of the entire application, including user information (context.userId).

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)\>\>

A promise that resolves to the created agenda section object.

## Remarks

This function performs caching and retrieval operations to ensure the latest data is used.
It also verifies that the user has the necessary permissions to create the agenda section in the context of the specified event.

## Defined in

[src/resolvers/Mutation/createAgendaSection.ts:37](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/createAgendaSection.ts#L37)
