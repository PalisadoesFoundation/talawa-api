[**talawa-api**](../../../../README.md)

***

# Function: addFeedback()

> **addFeedback**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)\>\>

Mutation resolver function to add feedback for an event.

This function pcerforms the following ations:
1. Checks if the specified event exists.
2. Retrieves the event attendee record for the current user and event.
3. Checks if the user is registered for the event and if they have checked in.
4. Ensures the user has not already submitted feedback for the event.
5. Updates the check-in record to mark feedback as submitted.
6. Creates and saves a new feedback entry.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAddFeedbackArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAddFeedbackArgs.md), `"data"`\>

The arguments for the mutation, including:
  - `data.eventId`: The ID of the event for which feedback is being submitted.
  - `data.feedback`: The feedback content to be submitted.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user making the request.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFeedback`](../../../../models/Feedback/interfaces/InterfaceFeedback.md)\>\>

A promise that resolves to the newly created feedback document.

## See

 - Event - The Event model used to interact with the events collection in the database.
 - EventAttendee - The EventAttendee model used to manage event attendee records.
 - CheckIn - The CheckIn model used to manage check-in records.
 - Feedback - The Feedback model used to create and manage feedback entries.
 - MutationResolvers - The type definition for the mutation resolvers.

## Defined in

[src/resolvers/Mutation/addFeedback.ts:37](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/addFeedback.ts#L37)
