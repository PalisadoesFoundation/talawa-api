[**talawa-api**](../../../../README.md)

***

# Function: createPlugin()

> **createPlugin**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePlugin`](../../../../models/Plugin/interfaces/InterfacePlugin.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePlugin`](../../../../models/Plugin/interfaces/InterfacePlugin.md)\>\>

Creates a new plugin and triggers a subscription event.

This resolver performs the following steps:

1. Creates a new plugin using the provided arguments.
2. Publishes an update event to the `TALAWA_PLUGIN_UPDATED` subscription channel with the created plugin details.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreatePluginArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreatePluginArgs.md), `"pluginCreatedBy"` \| `"pluginDesc"` \| `"pluginName"`\>

The input arguments for the mutation, which include:
  - `data`: An object containing the plugin's details.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePlugin`](../../../../models/Plugin/interfaces/InterfacePlugin.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePlugin`](../../../../models/Plugin/interfaces/InterfacePlugin.md)\>\>

The created plugin object.

## Remarks

This function creates a plugin record, updates the subscription channel with the new plugin details, and returns the created plugin.

## Defined in

[src/resolvers/Mutation/createPlugin.ts:21](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/createPlugin.ts#L21)
