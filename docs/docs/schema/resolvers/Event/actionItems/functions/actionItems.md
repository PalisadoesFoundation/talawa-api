[**talawa-api**](../../../../README.md)

***

# Function: actionItems()

> **actionItems**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[]\>

Resolver function for the `actionItems` field of an `Event`.

This function retrieves the action items associated with a specific event.

## Parameters

### parent

[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)

The parent object representing the event. It contains information about the event, including the ID of the action items associated with it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[]\>

A promise that resolves to an array of action item documents found in the database. These documents represent the action items associated with the event.

## See

 - ActionItem - The ActionItem model used to interact with the action items collection in the database.
 - EventResolvers - The type definition for the resolvers of the Event fields.

## Defined in

[src/resolvers/Event/actionItems.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Event/actionItems.ts#L16)
