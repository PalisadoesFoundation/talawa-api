[**talawa-api**](../../../../README.md)

***

# Function: removeEventVolunteer()

> **removeEventVolunteer**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>\>

This function enables to remove an Event Volunteer.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveEventVolunteerArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveEventVolunteerArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>\>

Event Volunteer.

## Remarks

The following checks are done:
1. If the user exists.
2. If the Event Volunteer exists.
3. Remove the Event Volunteer from their groups and delete the volunteer.
4. Delete the volunteer and their memberships in a single operation.

## Defined in

[src/resolvers/Mutation/removeEventVolunteer.ts:25](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/removeEventVolunteer.ts#L25)
