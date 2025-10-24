[Admin Docs](/)

***

# Function: getQueryPluginsInput()

> **getQueryPluginsInput**(): `object`

Defined in: [src/graphql/types/Plugin/inputs.ts:125](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/types/Plugin/inputs.ts#L125)

## Returns

`object`

### schema

> **schema**: `ZodObject`\<\{ `isActivated`: `ZodOptional`\<`ZodBoolean`\>; `isInstalled`: `ZodOptional`\<`ZodBoolean`\>; `pluginId`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}, \{ `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}\> = `queryPluginsInputSchema`

### type

> **type**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `isActivated?`: `null` \| `boolean`; `isInstalled?`: `null` \| `boolean`; `pluginId?`: `null` \| `string`; \}\> = `QueryPluginsInput`
