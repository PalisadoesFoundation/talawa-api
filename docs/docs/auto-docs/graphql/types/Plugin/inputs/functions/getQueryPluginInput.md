[API Docs](/)

***

# Function: getQueryPluginInput()

> **getQueryPluginInput**(): `object`

Defined in: src/graphql/types/Plugin/inputs.ts:120

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `id`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; \}, \{ `id`: `string`; \}\> = `queryPluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `id`: `string`; \}\> = `QueryPluginInput`
