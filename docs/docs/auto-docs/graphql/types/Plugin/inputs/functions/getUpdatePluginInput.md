[API Docs](/)

***

# Function: getUpdatePluginInput()

> **getUpdatePluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:140](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Plugin/inputs.ts#L140)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `backup`: `ZodOptional`\<`ZodBoolean`\>; `id`: `ZodString`; `isActivated`: `ZodOptional`\<`ZodBoolean`\>; `isInstalled`: `ZodOptional`\<`ZodBoolean`\>; `pluginId`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\> = `updatePluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `backup?`: `boolean` \| `null`; `id`: `string`; `isActivated?`: `boolean` \| `null`; `isInstalled?`: `boolean` \| `null`; `pluginId?`: `string` \| `null`; \}\> = `UpdatePluginInput`
