[Admin Docs](/)

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

[src/resolvers/Query/hasSubmittedFeedback.ts:22](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Query/hasSubmittedFeedback.ts#L22)
