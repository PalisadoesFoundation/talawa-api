[Admin Docs](/)

***

# Function: getUpdatePluginInput()

> **getUpdatePluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:109](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Plugin/inputs.ts#L109)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `backup`: `ZodOptional`\<`ZodBoolean`\>; `id`: `ZodString`; `isActivated`: `ZodOptional`\<`ZodBoolean`\>; `isInstalled`: `ZodOptional`\<`ZodBoolean`\>; `pluginId`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `backup?`: `boolean`; `id?`: `string`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}, \{ `backup?`: `boolean`; `id?`: `string`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}\> = `updatePluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `backup?`: `boolean`; `id?`: `string`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}\> = `UpdatePluginInput`
