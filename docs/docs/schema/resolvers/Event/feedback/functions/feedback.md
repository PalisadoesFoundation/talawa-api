[**talawa-api**](../../../../README.md)

***

# Function: feedback()

> **feedback**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)\>[]\>

Resolver function for the `feedback` field of an `Event`.

This function retrieves the feedback associated with a specific event.

## Parameters

### parent

[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)

The parent object representing the event. It contains information about the event, including the ID of the feedback associated with it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)\>[]\>

A promise that resolves to an array of feedback documents found in the database. These documents represent the feedback associated with the event.

## See

 - Feedback - The Feedback model used to interact with the feedback collection in the database.
 - EventResolvers - The type definition for the resolvers of the Event fields.

## Defined in

[src/resolvers/Event/feedback.ts:16](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Event/feedback.ts#L16)
