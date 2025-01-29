[**talawa-api**](../../../../README.md)

***

# Function: actionItemsByOrganization()

> **actionItemsByOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[]\>

This query will fetch all action items for an organization from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryActionItemsByOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryActionItemsByOrganizationArgs.md), `"organizationId"`\>

An object that contains `organizationId` which is the _id of the Organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[]\>

An `actionItems` object that holds all action items for the Event.

## Defined in

[src/resolvers/Query/actionItemsByOrganization.ts:17](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/actionItemsByOrganization.ts#L17)
