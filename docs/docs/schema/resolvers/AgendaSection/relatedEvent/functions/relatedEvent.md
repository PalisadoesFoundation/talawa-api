[**talawa-api**](../../../../README.md)

***

# Function: relatedEvent()

> **relatedEvent**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

Resolver function for the `relatedEvent` field of an `AgendaSection`.

This function retrieves the event related to a specific agenda section.

## Parameters

### parent

[`InterfaceAgendaSection`](../../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)

The parent object representing the agenda section. It contains information about the agenda section, including the ID of the related event.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

A promise that resolves to the event document found in the database. This document represents the event related to the agenda section.

## See

 - Event - The Event model used to interact with the events collection in the database.
 - AgendaSectionResolvers - The type definition for the resolvers of the AgendaSection fields.

## Defined in

[src/resolvers/AgendaSection/relatedEvent.ts:17](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/AgendaSection/relatedEvent.ts#L17)
