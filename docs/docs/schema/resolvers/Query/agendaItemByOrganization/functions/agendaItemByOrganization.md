[**talawa-api**](../../../../README.md)

***

# Function: agendaItemByOrganization()

> **agendaItemByOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\>[]\>

This query will fetch all items for the organization from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryAgendaItemByOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryAgendaItemByOrganizationArgs.md), `"organizationId"`\>

An object that contains `organizationId` which is the _id of the Organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\>[]\>

A `Item` object that holds all Item for the Organization.

## Defined in

[src/resolvers/Query/agendaItemByOrganization.ts:10](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/agendaItemByOrganization.ts#L10)
