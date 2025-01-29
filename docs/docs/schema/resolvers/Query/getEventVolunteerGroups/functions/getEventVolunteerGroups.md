[**talawa-api**](../../../../README.md)

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

[src/resolvers/Query/getEventVolunteerGroups.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getEventVolunteerGroups.ts#L16)
