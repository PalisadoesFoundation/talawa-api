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

[src/resolvers/Mutation/updatePluginStatus.ts:15](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/updatePluginStatus.ts#L15)
