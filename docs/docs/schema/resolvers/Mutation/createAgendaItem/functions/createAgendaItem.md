[Admin Docs](/)

***

# Function: createAgendaItem()

> **createAgendaItem**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\>\>

Creates a new agenda item and associates it with an event if specified.

This function performs the following actions:
1. Verifies that the current user exists and is authorized.
2. Checks the existence of the specified organization.
3. If a related event is specified, verifies its existence and checks if the user is an admin of the event.
4. Checks if the user is an admin of the organization or has super admin privileges.
5. Creates the new agenda item and associates it with the event if applicable.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateAgendaItemArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateAgendaItemArgs.md), `"input"`\>

The arguments for the mutation, including:
  - `input`: An object containing:
    - `organizationId`: The ID of the organization where the agenda item will be created.
    - `relatedEventId` (optional): The ID of the related event, if applicable.
    - Other agenda item details.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user making the request.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\>\>

The created agenda item.

## Defined in

[src/resolvers/Mutation/createAgendaItem.ts:53](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/createAgendaItem.ts#L53)
