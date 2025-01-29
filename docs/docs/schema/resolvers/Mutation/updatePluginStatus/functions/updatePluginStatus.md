[**talawa-api**](../../../../README.md)

***

# Function: updatePluginStatus()

> **updatePluginStatus**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePlugin`](../../../../models/Plugin/interfaces/InterfacePlugin.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePlugin`](../../../../models/Plugin/interfaces/InterfacePlugin.md)\>\>

This function enables to update plugin install status.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdatePluginStatusArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdatePluginStatusArgs.md), `"id"` \| `"orgId"`\>

payload provided with the request contains _id of the plugin and orgID of the org that wants to change it's status.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePlugin`](../../../../models/Plugin/interfaces/InterfacePlugin.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePlugin`](../../../../models/Plugin/interfaces/InterfacePlugin.md)\>\>

Updated PLugin status.

## Defined in

[src/resolvers/Mutation/updatePluginStatus.ts:15](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/updatePluginStatus.ts#L15)
