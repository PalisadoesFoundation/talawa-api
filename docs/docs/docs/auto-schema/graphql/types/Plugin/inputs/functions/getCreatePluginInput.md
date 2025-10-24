[Admin Docs](/)

***

# Function: getCreatePluginInput()

> **getCreatePluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:130](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Plugin/inputs.ts#L130)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `pluginId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `pluginId`: `string`; \}, \{ `pluginId`: `string`; \}\> = `createPluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `pluginId`: `string`; \}\> = `CreatePluginInput`
