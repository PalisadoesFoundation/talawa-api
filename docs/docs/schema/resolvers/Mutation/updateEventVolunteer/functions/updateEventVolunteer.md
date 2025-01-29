[**talawa-api**](../../../../README.md)

***

# Function: updateEventVolunteer()

> **updateEventVolunteer**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>\>

This function enables to update an Event Volunteer

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateEventVolunteerArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateEventVolunteerArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>\>

## Remarks

The following checks are done:
1. Whether the user exists
2. Whether the EventVolunteer exists
3. Whether the current user is the user of EventVolunteer
4. Update the EventVolunteer

## Defined in

[src/resolvers/Mutation/updateEventVolunteer.ts:21](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/updateEventVolunteer.ts#L21)
