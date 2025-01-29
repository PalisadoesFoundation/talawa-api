[**talawa-api**](../../../../README.md)

***

# Function: agendaItemCategoriesByOrganization()

> **agendaItemCategoriesByOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>[]\>

This query will fetch all categories for the organization from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryAgendaItemCategoriesByOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryAgendaItemCategoriesByOrganizationArgs.md), `"organizationId"`\>

An object that contains `organizationId` which is the _id of the Organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>[]\>

A `categories` object that holds all categories for the Organization.

## Defined in

[src/resolvers/Query/agendaItemCategoriesByOrganization.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/agendaItemCategoriesByOrganization.ts#L10)
