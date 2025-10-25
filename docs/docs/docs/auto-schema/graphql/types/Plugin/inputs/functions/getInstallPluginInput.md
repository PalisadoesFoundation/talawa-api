[Admin Docs](/)

***

# Function: getInstallPluginInput()

> **getInstallPluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:135](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/graphql/types/Plugin/inputs.ts#L135)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `pluginId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `pluginId`: `string`; \}, \{ `pluginId`: `string`; \}\> = `installPluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `pluginId`: `string`; \}\> = `InstallPluginInput`
