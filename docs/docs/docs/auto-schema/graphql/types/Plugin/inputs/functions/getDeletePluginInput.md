[Admin Docs](/)

***

# Function: getDeletePluginInput()

> **getDeletePluginInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:114](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Plugin/inputs.ts#L114)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `id`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `id?`: `string`; \}, \{ `id?`: `string`; \}\> = `deletePluginInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `id?`: `string`; \}\> = `DeletePluginInput`
