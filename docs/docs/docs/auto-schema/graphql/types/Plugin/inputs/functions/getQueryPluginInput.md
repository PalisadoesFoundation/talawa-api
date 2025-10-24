[Admin Docs](/)

***

# Function: getQueryPluginInput()

> **getQueryPluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:120](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Plugin/inputs.ts#L120)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `id`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; \}, \{ `id`: `string`; \}\> = `queryPluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `id`: `string`; \}\> = `QueryPluginInput`
