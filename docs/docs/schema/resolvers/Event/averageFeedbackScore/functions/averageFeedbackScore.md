[**talawa-api**](../../../../README.md)

***

# Function: averageFeedbackScore()

> **averageFeedbackScore**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`number`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`number`\>\>

Resolver function for the `averageFeedbackScore` field of an `Event`.

This function calculates the average feedback score for a specific event.

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

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`number`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`number`\>\>

A promise that resolves to the average feedback score for the event.

## See

 - Feedback - The Feedback model used to interact with the feedback collection in the database.
 - EventResolvers - The type definition for the resolvers of the Event fields.

## Defined in

[src/resolvers/Event/averageFeedbackScore.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Event/averageFeedbackScore.ts#L16)
