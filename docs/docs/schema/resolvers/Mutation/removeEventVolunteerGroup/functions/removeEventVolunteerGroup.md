[**talawa-api**](../../../../README.md)

***

# Function: removeEventVolunteerGroup()

> **removeEventVolunteerGroup**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>\>

This function enables to remove an Event Volunteer Group.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveEventVolunteerGroupArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveEventVolunteerGroupArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>\>

Event Volunteer group.

## Remarks

The following checks are done:
1. If the current user exists
2. If the Event volunteer group to be removed exists.
3. If the current user is the admin of the corresponding event

## Defined in

[src/resolvers/Mutation/removeEventVolunteerGroup.ts:31](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/removeEventVolunteerGroup.ts#L31)
