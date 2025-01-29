[**talawa-api**](../../../../README.md)

***

# Function: hasSubmittedFeedback()

> **hasSubmittedFeedback**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

Checks whether a user has submitted feedback for a specific event.

This function verifies if the given user and event exist in the database. It then checks if the user is registered and checked in for the event. Finally, it determines whether the user has submitted feedback for that event based on the check-in record.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryHasSubmittedFeedbackArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryHasSubmittedFeedbackArgs.md), `"userId"` \| `"eventId"`\>

The arguments provided to the GraphQL query. Should include:
  - `userId` (string): The ID of the user to check.
  - `eventId` (string): The ID of the event to check.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

A boolean value indicating whether the user has submitted feedback for the event. This is determined by checking the `feedbackSubmitted` property of the check-in record.

## Defined in

[src/resolvers/Query/hasSubmittedFeedback.ts:22](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/hasSubmittedFeedback.ts#L22)
