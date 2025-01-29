[Admin Docs](/)

***

# Function: getEventVolunteerGroups()

> **getEventVolunteerGroups**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>[]\>

This query will fetch eventVolunteerGroups as a transaction from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetEventVolunteerGroupsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetEventVolunteerGroupsArgs.md), `"where"`\>

An object that contains where object for eventVolunteerGroups.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>[]\>

An array of `eventVolunteerGroup` object.

## Defined in

[src/resolvers/Query/getEventVolunteerGroups.ts:16](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Query/getEventVolunteerGroups.ts#L16)
