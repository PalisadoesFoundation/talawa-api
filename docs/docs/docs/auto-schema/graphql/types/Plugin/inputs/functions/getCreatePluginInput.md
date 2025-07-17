[Admin Docs](/)

***

# Function: getCreatePluginInput()

> **getCreatePluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:104](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Plugin/inputs.ts#L104)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `backup`: `ZodOptional`\<`ZodBoolean`\>; `isActivated`: `ZodOptional`\<`ZodBoolean`\>; `isInstalled`: `ZodOptional`\<`ZodBoolean`\>; `pluginId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `backup?`: `boolean`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}, \{ `backup?`: `boolean`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}\> = `createPluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `backup?`: `boolean`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}\> = `CreatePluginInput`
