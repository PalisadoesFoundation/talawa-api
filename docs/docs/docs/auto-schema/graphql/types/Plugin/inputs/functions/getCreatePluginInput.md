[Admin Docs](/)

***

# Function: getCreatePluginInput()

> **getCreatePluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:130](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/types/Plugin/inputs.ts#L130)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `pluginId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `pluginId`: `string`; \}, \{ `pluginId`: `string`; \}\> = `createPluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `pluginId`: `string`; \}\> = `CreatePluginInput`
