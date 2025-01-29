[Admin Docs](/)

***

# Function: getEventInvitesByUserId()

> **getEventInvitesByUserId**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>[]\>

This query will fetch all the Event Invites in specified order from the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetEventInvitesByUserIdArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetEventInvitesByUserIdArgs.md), `"userId"`\>

An object containing userId.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>[]\>

An object that contains list of all Event Attendees.

## Defined in

[src/resolvers/Query/getEventInvitesByUserId.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Query/getEventInvitesByUserId.ts#L10)
