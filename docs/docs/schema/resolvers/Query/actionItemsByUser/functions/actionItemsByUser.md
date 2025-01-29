[Admin Docs](/)

***

# Function: actionItemsByUser()

> **actionItemsByUser**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[]\>

This query will fetch all action items for an organization from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryActionItemsByUserArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryActionItemsByUserArgs.md), `"userId"`\>

An object that contains `organizationId` which is the _id of the Organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>[]\>

An `actionItems` object that holds all action items for the Event.

## Defined in

[src/resolvers/Query/actionItemsByUser.ts:17](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Query/actionItemsByUser.ts#L17)
