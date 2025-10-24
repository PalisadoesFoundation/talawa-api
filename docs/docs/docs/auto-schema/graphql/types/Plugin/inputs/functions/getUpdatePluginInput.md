[Admin Docs](/)

***

# Function: getUpdatePluginInput()

> **getUpdatePluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:140](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Plugin/inputs.ts#L140)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `backup`: `ZodOptional`\<`ZodBoolean`\>; `id`: `ZodString`; `isActivated`: `ZodOptional`\<`ZodBoolean`\>; `isInstalled`: `ZodOptional`\<`ZodBoolean`\>; `pluginId`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `backup?`: `boolean`; `id`: `string`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}, \{ `backup?`: `boolean`; `id`: `string`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}\> = `updatePluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `backup?`: `null` \| `boolean`; `id`: `string`; `isActivated?`: `null` \| `boolean`; `isInstalled?`: `null` \| `boolean`; `pluginId?`: `null` \| `string`; \}\> = `UpdatePluginInput`
