[**talawa-api**](../../../../README.md)

***

# Function: createEvent()

> **createEvent**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

Creates a new event and associates it with an organization.

This resolver handles both recurring and non-recurring events, performing the following steps:

1. Validates the existence of the user, their app user profile, and the associated organization.
2. Checks if the user is authorized to create an event in the organization.
3. Validates the provided event details, including title, description, location, and date range.
4. Creates the event using the appropriate method based on whether it's recurring or not.
5. Uses a database transaction to ensure data consistency.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateEventArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateEventArgs.md), `"data"`\>

The input arguments for the mutation, including:
  - `data`: An object containing:
    - `organizationId`: The ID of the organization to associate with the event.
    - `title`: The title of the event (max 256 characters).
    - `description`: A description of the event (max 500 characters).
    - `location`: The location of the event (max 50 characters).
    - `startDate`: The start date of the event.
    - `endDate`: The end date of the event.
    - `recurring`: A boolean indicating if the event is recurring.

### context

`any`

The context object containing user information (context.userId).

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

A promise that resolves to the created event object.

## Remarks

This function uses a transaction to ensure that either all operations succeed or none do, maintaining data integrity.

## Defined in

[src/resolvers/Mutation/createEvent.ts:57](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/createEvent.ts#L57)
