[Admin Docs](/)

***

# Function: getUpdatePluginInput()

> **getUpdatePluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:140](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/types/Plugin/inputs.ts#L140)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `backup`: `ZodOptional`\<`ZodBoolean`\>; `id`: `ZodString`; `isActivated`: `ZodOptional`\<`ZodBoolean`\>; `isInstalled`: `ZodOptional`\<`ZodBoolean`\>; `pluginId`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `backup?`: `boolean`; `id`: `string`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}, \{ `backup?`: `boolean`; `id`: `string`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}\> = `updatePluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `backup?`: `null` \| `boolean`; `id`: `string`; `isActivated?`: `null` \| `boolean`; `isInstalled?`: `null` \| `boolean`; `pluginId?`: `null` \| `string`; \}\> = `UpdatePluginInput`
