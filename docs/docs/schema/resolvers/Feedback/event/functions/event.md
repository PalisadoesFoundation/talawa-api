[**talawa-api**](../../../../README.md)

***

# Function: event()

> **event**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

Resolver function for the `event` field of a `Feedback`.

This function retrieves the event associated with a specific feedback.

## Parameters

### parent

[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)

The parent object representing the feedback. It contains information about the feedback, including the ID of the event associated with it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

A promise that resolves to the event document found in the database. This document represents the event associated with the feedback.

## See

 - Event - The Event model used to interact with the events collection in the database.
 - FeedbackResolvers - The type definition for the resolvers of the Feedback fields.

## Defined in

[src/resolvers/Feedback/event.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Feedback/event.ts#L16)
