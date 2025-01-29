[**talawa-api**](../../../../README.md)

***

# Function: updateEventVolunteerGroup()

> **updateEventVolunteerGroup**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>\>

This function enables to update the Event Volunteer Group

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateEventVolunteerGroupArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateEventVolunteerGroupArgs.md), `"data"` \| `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>\>

## Remarks

The following checks are done:
1. Whether the user exists
2. Whether the EventVolunteerGroup exists
3. Whether the current user is the leader of EventVolunteerGroup

## Defined in

[src/resolvers/Mutation/updateEventVolunteerGroup.ts:22](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/updateEventVolunteerGroup.ts#L22)
