[Admin Docs](/)

***

# Function: recurrenceRule()

> **recurrenceRule**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceRecurrenceRule`](../../../../models/RecurrenceRule/interfaces/InterfaceRecurrenceRule.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceRecurrenceRule`](../../../../models/RecurrenceRule/interfaces/InterfaceRecurrenceRule.md)\>\>

Resolver function for the `recurrenceRule` field of an `Event`.

This function retrieves the recurrence rule associated with a specific event.

## Parameters

### parent

[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)

The parent object representing the event. It contains information about the event, including the ID of the recurrence rule associated with it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceRecurrenceRule`](../../../../models/RecurrenceRule/interfaces/InterfaceRecurrenceRule.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceRecurrenceRule`](../../../../models/RecurrenceRule/interfaces/InterfaceRecurrenceRule.md)\>\>

A promise that resolves to the recurrence rule document found in the database. This document represents the recurrence rule associated with the event.

## See

 - RecurrenceRule - The RecurrenceRule model used to interact with the recurrence rules collection in the database.
 - EventResolvers - The type definition for the resolvers of the Event fields.

## Defined in

[src/resolvers/Event/recurrenceRule.ts:17](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Event/recurrenceRule.ts#L17)
